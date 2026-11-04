import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import type { CartLine } from '../types/cart.ts'

export type CartListName = (typeof t.cartList.enumValues)[number]

export async function findCart(db: DbOrTx, id: string) {
  const [cart] = await db.select().from(t.carts).where(eq(t.carts.id, id))
  return cart
}

export async function createCart(db: DbOrTx) {
  const [cart] = await db.insert(t.carts).values({}).returning()
  if (!cart) throw new Error('Could not create cart')
  return cart
}

export async function updateCart(db: DbOrTx, id: string, values: { promo?: string | null; giftNote?: string | null }) {
  await db
    .update(t.carts)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(t.carts.id, id))
}

export async function getLines(db: DbOrTx, cartId: string) {
  const rows = await db
    .select()
    .from(t.cartLines)
    .where(eq(t.cartLines.cartId, cartId))
    .orderBy(asc(t.cartLines.addedAt))
  const toLine = (row: (typeof rows)[number]): CartLine => ({
    key: row.key,
    id: row.itemId,
    ...(row.option !== null && { option: row.option }),
    qty: row.qty,
  })
  return {
    lines: rows.filter((r) => r.list === 'cart').map(toLine),
    saved: rows.filter((r) => r.list === 'saved').map(toLine),
  }
}

export async function findLine(db: DbOrTx, cartId: string, list: CartListName, key: string) {
  const [row] = await db
    .select()
    .from(t.cartLines)
    .where(and(eq(t.cartLines.cartId, cartId), eq(t.cartLines.list, list), eq(t.cartLines.key, key)))
  return row
}

export async function addToLine(db: DbOrTx, cartId: string, line: CartLine, max: number) {
  await db
    .insert(t.cartLines)
    .values({ cartId, list: 'cart', key: line.key, itemId: line.id, option: line.option ?? null, qty: line.qty })
    .onConflictDoUpdate({
      target: [t.cartLines.cartId, t.cartLines.list, t.cartLines.key],
      set: { qty: sql`least(${max}, ${t.cartLines.qty} + excluded.qty)` },
    })
}

export async function putLine(db: DbOrTx, cartId: string, list: CartListName, line: CartLine) {
  await db
    .insert(t.cartLines)
    .values({ cartId, list, key: line.key, itemId: line.id, option: line.option ?? null, qty: line.qty })
    .onConflictDoUpdate({
      target: [t.cartLines.cartId, t.cartLines.list, t.cartLines.key],
      set: { qty: line.qty, itemId: line.id, option: line.option ?? null, addedAt: new Date() },
    })
}

export async function setLineQty(db: DbOrTx, cartId: string, key: string, qty: number) {
  await db
    .update(t.cartLines)
    .set({ qty })
    .where(and(eq(t.cartLines.cartId, cartId), eq(t.cartLines.list, 'cart'), eq(t.cartLines.key, key)))
}

export async function deleteLine(db: DbOrTx, cartId: string, list: CartListName, key: string) {
  await db
    .delete(t.cartLines)
    .where(and(eq(t.cartLines.cartId, cartId), eq(t.cartLines.list, list), eq(t.cartLines.key, key)))
}

export async function deleteOtherClubLines(db: DbOrTx, cartId: string, keepKey: string) {
  await db
    .delete(t.cartLines)
    .where(
      and(
        eq(t.cartLines.cartId, cartId),
        eq(t.cartLines.list, 'cart'),
        ne(t.cartLines.key, keepKey),
        inArray(t.cartLines.itemId, db.select({ id: t.clubPlans.id }).from(t.clubPlans)),
      ),
    )
}

export async function clearLines(db: DbOrTx, cartId: string, list: CartListName) {
  await db.delete(t.cartLines).where(and(eq(t.cartLines.cartId, cartId), eq(t.cartLines.list, list)))
}
