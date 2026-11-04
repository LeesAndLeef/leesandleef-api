import type { DbOrTx } from '../db/client.ts'
import { type OrderView, toOrderView } from '../lib/orderView.ts'
import { findOrder, findOrderLines } from '../repositories/order.repository.ts'
import { findItems } from '../repositories/product.repository.ts'
import { notFound } from '../utils/errors.ts'

export async function loadOrderView(db: DbOrTx, orderId: string): Promise<OrderView> {
  const order = await findOrder(db, orderId)
  if (!order) throw notFound('Order not found')
  const lines = await findOrderLines(db, orderId)
  const items = await findItems(
    db,
    lines.map((line) => line.itemId),
  )
  return toOrderView(order, lines, items)
}
