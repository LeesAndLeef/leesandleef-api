import type { Db, DbOrTx } from '../db/client.ts'
import { lineKey, maxQty, normalizeOption } from '../lib/cartOptions.ts'
import { computeTotals, priceLines } from '../lib/pricing.ts'
import * as repo from '../repositories/cart.repository.ts'
import { findItem, findItems } from '../repositories/product.repository.ts'
import { findActivePromo } from '../repositories/promo.repository.ts'
import type { PricedCart } from '../types/cart.ts'
import type { CartItem } from '../types/content.ts'
import { notFound, unprocessable } from '../utils/errors.ts'

export const EMPTY_PRICED_CART: PricedCart = {
  id: null,
  lines: [],
  saved: [],
  promo: null,
  giftNote: null,
  totals: computeTotals([], 0),
}

export async function loadPricedCart(db: DbOrTx, cartId: string | null): Promise<PricedCart> {
  const cart = cartId ? await repo.findCart(db, cartId) : undefined
  if (!cart) return EMPTY_PRICED_CART
  const { lines, saved } = await repo.getLines(db, cart.id)
  const [items, promo] = await Promise.all([
    findItems(
      db,
      [...lines, ...saved].map((l) => l.id),
    ),
    cart.promo ? findActivePromo(db, cart.promo) : undefined,
  ])
  const priced = priceLines(lines, items)
  return {
    id: cart.id,
    lines: priced,
    saved: priceLines(saved, items),
    promo: promo?.code ?? null,
    giftNote: cart.giftNote,
    totals: computeTotals(priced, promo?.rate ?? 0),
  }
}

async function requireItem(db: DbOrTx, id: string): Promise<CartItem> {
  const item = await findItem(db, id)
  if (!item) throw notFound(`Product ${id} not found`)
  return item
}

async function mutate(db: Db, cartId: string, change: (tx: DbOrTx) => Promise<void>) {
  return db.transaction(async (tx) => {
    await change(tx)
    await repo.updateCart(tx, cartId, {})
    return loadPricedCart(tx, cartId)
  })
}

export function addItem(db: Db, cartId: string, input: { id: string; qty: number; option?: string }) {
  return mutate(db, cartId, async (tx) => {
    const item = await requireItem(tx, input.id)
    const normalized = normalizeOption(item, input.option)
    if (!normalized.ok) throw unprocessable(normalized.message)
    const key = lineKey(item.id, normalized.option)
    const max = maxQty(item)
    if (item.kind === 'club') await repo.deleteOtherClubLines(tx, cartId, key)
    await repo.deleteLine(tx, cartId, 'saved', key)
    await repo.addToLine(
      tx,
      cartId,
      { key, id: item.id, option: normalized.option, qty: Math.min(max, input.qty) },
      max,
    )
  })
}

export function setQty(db: Db, cartId: string, key: string, qty: number) {
  return mutate(db, cartId, async (tx) => {
    const line = await repo.findLine(tx, cartId, 'cart', key)
    if (!line) throw notFound(`Cart line ${key} not found`)
    const item = await requireItem(tx, line.itemId)
    await repo.setLineQty(tx, cartId, key, Math.min(maxQty(item), qty))
  })
}

export function removeLine(db: Db, cartId: string, key: string) {
  return mutate(db, cartId, (tx) => repo.deleteLine(tx, cartId, 'cart', key))
}

export function removeSaved(db: Db, cartId: string, key: string) {
  return mutate(db, cartId, (tx) => repo.deleteLine(tx, cartId, 'saved', key))
}

export function saveForLater(db: Db, cartId: string, key: string) {
  return mutate(db, cartId, async (tx) => {
    const line = await repo.findLine(tx, cartId, 'cart', key)
    if (!line) throw notFound(`Cart line ${key} not found`)
    await repo.deleteLine(tx, cartId, 'cart', key)
    await repo.putLine(tx, cartId, 'saved', { key, id: line.itemId, option: line.option ?? undefined, qty: line.qty })
  })
}

export function moveToCart(db: Db, cartId: string, key: string) {
  return mutate(db, cartId, async (tx) => {
    const line = await repo.findLine(tx, cartId, 'saved', key)
    if (!line) throw notFound(`Saved line ${key} not found`)
    const item = await requireItem(tx, line.itemId)
    if (item.kind === 'club') await repo.deleteOtherClubLines(tx, cartId, key)
    await repo.deleteLine(tx, cartId, 'saved', key)
    const qty = Math.min(maxQty(item), line.qty)
    await repo.putLine(tx, cartId, 'cart', { key, id: line.itemId, option: line.option ?? undefined, qty })
  })
}

export function applyPromo(db: Db, cartId: string, code: string) {
  return mutate(db, cartId, async (tx) => {
    const promo = await findActivePromo(tx, code.trim().toUpperCase())
    if (!promo) throw unprocessable(`Promo code ${code} is not valid`)
    await repo.updateCart(tx, cartId, { promo: promo.code })
  })
}

export function removePromo(db: Db, cartId: string) {
  return mutate(db, cartId, (tx) => repo.updateCart(tx, cartId, { promo: null }))
}

export function setGiftNote(db: Db, cartId: string, note: string | null) {
  return mutate(db, cartId, (tx) => repo.updateCart(tx, cartId, { giftNote: note?.trim() || null }))
}

export function clearCart(db: DbOrTx, cartId: string) {
  return Promise.all([
    repo.clearLines(db, cartId, 'cart'),
    repo.updateCart(db, cartId, { promo: null, giftNote: null }),
  ])
}
