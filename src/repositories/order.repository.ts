import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export type OrderRow = typeof t.orders.$inferSelect
export type NewOrder = typeof t.orders.$inferInsert
export type OrderLineRow = typeof t.orderLines.$inferSelect
export type OrderStatus = OrderRow['status']

export async function insertOrder(db: DbOrTx, order: NewOrder, lines: Omit<OrderLineRow, 'orderId'>[]) {
  const [row] = await db.insert(t.orders).values(order).returning()
  if (!row) throw new Error('Could not create order')
  await db.insert(t.orderLines).values(lines.map((line) => ({ ...line, orderId: row.id })))
  return row
}

export async function findOrder(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.orders).where(eq(t.orders.id, id))
  return row
}

export async function findOrderByPayment(db: DbOrTx, paymentIntentId: string) {
  const [row] = await db.select().from(t.orders).where(eq(t.orders.paymentIntentId, paymentIntentId))
  return row
}

export function findOrdersByUser(db: DbOrTx, userId: string) {
  return db.select().from(t.orders).where(eq(t.orders.userId, userId)).orderBy(desc(t.orders.createdAt))
}

export function findOrderLines(db: DbOrTx, orderIds: string[]) {
  if (orderIds.length === 0) return Promise.resolve([])
  return db
    .select()
    .from(t.orderLines)
    .where(inArray(t.orderLines.orderId, orderIds))
    .orderBy(asc(t.orderLines.position))
}

export async function setPaymentIntent(db: DbOrTx, id: string, paymentIntentId: string) {
  await db.update(t.orders).set({ paymentIntentId }).where(eq(t.orders.id, id))
}

export async function transition(db: DbOrTx, id: string, from: OrderStatus, to: OrderStatus) {
  const [row] = await db
    .update(t.orders)
    .set({ status: to, ...(to === 'paid' && { paidAt: new Date() }) })
    .where(and(eq(t.orders.id, id), eq(t.orders.status, from)))
    .returning()
  return row
}

export async function claimConfirmation(db: DbOrTx, id: string) {
  const [row] = await db
    .update(t.orders)
    .set({ confirmationSentAt: new Date() })
    .where(and(eq(t.orders.id, id), isNull(t.orders.confirmationSentAt)))
    .returning({ id: t.orders.id })
  return row !== undefined
}

export async function releaseConfirmation(db: DbOrTx, id: string) {
  await db.update(t.orders).set({ confirmationSentAt: null }).where(eq(t.orders.id, id))
}
