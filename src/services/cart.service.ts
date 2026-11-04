import { MAX_CART_LINES } from '../config/constants.ts'
import type { DbOrTx } from '../db/client.ts'
import { lineKey, maxQty, normalizeOption } from '../lib/cartOptions.ts'
import { computeTotals, priceLines } from '../lib/pricing.ts'
import { findOrder } from '../repositories/order.repository.ts'
import { findItem, findItems } from '../repositories/product.repository.ts'
import { findActivePromo } from '../repositories/promo.repository.ts'
import type { CartLine, CartState, PricedCart } from '../types/cart.ts'
import type { CartItem } from '../types/content.ts'
import { notFound, unprocessable } from '../utils/errors.ts'

export interface CartResult {
  state: CartState
  cart: PricedCart
}

const SETTLED_STATUSES = new Set(['awaiting_transfer', 'paid', 'shipped'])

export async function priceCart(db: DbOrTx, state: CartState): Promise<PricedCart> {
  const items = await findItems(
    db,
    [...state.lines, ...state.saved].map((line) => line.id),
  )
  const promo = state.promo ? await findActivePromo(db, state.promo) : undefined
  const lines = priceLines(state.lines, items)
  return {
    lines,
    saved: priceLines(state.saved, items),
    promo: promo?.code ?? null,
    giftNote: state.giftNote,
    totals: computeTotals(lines, promo?.rate ?? 0),
  }
}

export const emptied = (state: CartState): CartState => ({
  ...state,
  lines: [],
  promo: null,
  giftNote: null,
  pendingOrderId: null,
})

export async function settleCart(db: DbOrTx, state: CartState): Promise<CartState> {
  if (!state.pendingOrderId) return state
  const order = await findOrder(db, state.pendingOrderId)
  if (order?.status === 'pending_payment') return state
  if (order && SETTLED_STATUSES.has(order.status)) return emptied(state)
  return { ...state, pendingOrderId: null }
}

async function commit(
  db: DbOrTx,
  state: CartState,
  change: (state: CartState) => CartState | Promise<CartState> = (same) => same,
): Promise<CartResult> {
  const next = await change(await settleCart(db, state))
  return { state: next, cart: await priceCart(db, next) }
}

async function requireItem(db: DbOrTx, id: string): Promise<CartItem> {
  const item = await findItem(db, id)
  if (!item) throw notFound(`Product ${id} not found`)
  return item
}

function requireLine(lines: CartLine[], key: string, label: string) {
  const line = lines.find((l) => l.key === key)
  if (!line) throw notFound(`${label} ${key} not found`)
  return line
}

function append(lines: CartLine[], line: CartLine) {
  const others = lines.filter((l) => l.key !== line.key)
  if (others.length >= MAX_CART_LINES) throw unprocessable(`A cart holds at most ${MAX_CART_LINES} different items`)
  return [...others, line]
}

async function withoutOtherClubPlans(db: DbOrTx, lines: CartLine[], keepKey: string) {
  const items = await findItems(
    db,
    lines.map((line) => line.id),
  )
  return lines.filter((line) => line.key === keepKey || items.get(line.id)?.kind !== 'club')
}

export const getCart = (db: DbOrTx, state: CartState) => commit(db, state)

export function addItem(db: DbOrTx, state: CartState, input: { id: string; qty: number; option?: string }) {
  return commit(db, state, async (cart) => {
    const item = await requireItem(db, input.id)
    const normalized = normalizeOption(item, input.option)
    if (!normalized.ok) throw unprocessable(normalized.message)
    const key = lineKey(item.id, normalized.option)
    const max = maxQty(item)
    const lines = item.kind === 'club' ? await withoutOtherClubPlans(db, cart.lines, key) : cart.lines
    const saved = cart.saved.filter((line) => line.key !== key)
    const existing = lines.find((line) => line.key === key)
    if (existing) {
      const qty = Math.min(max, existing.qty + input.qty)
      return { ...cart, saved, lines: lines.map((line) => (line.key === key ? { ...line, qty } : line)) }
    }
    const line: CartLine = {
      key,
      id: item.id,
      ...(normalized.option && { option: normalized.option }),
      qty: Math.min(max, input.qty),
    }
    return { ...cart, saved, lines: append(lines, line) }
  })
}

export function setQty(db: DbOrTx, state: CartState, key: string, qty: number) {
  return commit(db, state, async (cart) => {
    const line = requireLine(cart.lines, key, 'Cart line')
    const item = await requireItem(db, line.id)
    const capped = Math.min(maxQty(item), qty)
    return { ...cart, lines: cart.lines.map((l) => (l.key === key ? { ...l, qty: capped } : l)) }
  })
}

export function removeLine(db: DbOrTx, state: CartState, key: string) {
  return commit(db, state, (cart) => ({ ...cart, lines: cart.lines.filter((line) => line.key !== key) }))
}

export function removeSaved(db: DbOrTx, state: CartState, key: string) {
  return commit(db, state, (cart) => ({ ...cart, saved: cart.saved.filter((line) => line.key !== key) }))
}

export function saveForLater(db: DbOrTx, state: CartState, key: string) {
  return commit(db, state, (cart) => {
    const line = requireLine(cart.lines, key, 'Cart line')
    return { ...cart, lines: cart.lines.filter((l) => l.key !== key), saved: append(cart.saved, line) }
  })
}

export function moveToCart(db: DbOrTx, state: CartState, key: string) {
  return commit(db, state, async (cart) => {
    const line = requireLine(cart.saved, key, 'Saved line')
    const item = await requireItem(db, line.id)
    const lines = item.kind === 'club' ? await withoutOtherClubPlans(db, cart.lines, key) : cart.lines
    return {
      ...cart,
      saved: cart.saved.filter((l) => l.key !== key),
      lines: append(lines, { ...line, qty: Math.min(maxQty(item), line.qty) }),
    }
  })
}

export function applyPromo(db: DbOrTx, state: CartState, code: string) {
  return commit(db, state, async (cart) => {
    const promo = await findActivePromo(db, code.trim().toUpperCase())
    if (!promo) throw unprocessable(`Promo code ${code} is not valid`)
    return { ...cart, promo: promo.code }
  })
}

export function removePromo(db: DbOrTx, state: CartState) {
  return commit(db, state, (cart) => ({ ...cart, promo: null }))
}

export function setGiftNote(db: DbOrTx, state: CartState, note: string | null) {
  return commit(db, state, (cart) => ({ ...cart, giftNote: note?.trim() || null }))
}

export function clearCart(db: DbOrTx, state: CartState) {
  return commit(db, state, (cart) => ({ ...cart, lines: [], promo: null, giftNote: null }))
}
