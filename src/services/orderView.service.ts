import type { DbOrTx } from '../db/client.ts'
import { type OrderView, toOrderView } from '../lib/orderView.ts'
import { findOrder, findOrderLines, type OrderRow } from '../repositories/order.repository.ts'
import { findItems } from '../repositories/product.repository.ts'
import { notFound } from '../utils/errors.ts'

export async function loadOrderViews(db: DbOrTx, orders: OrderRow[]): Promise<OrderView[]> {
  const lines = await findOrderLines(
    db,
    orders.map((order) => order.id),
  )
  const items = await findItems(
    db,
    lines.map((line) => line.itemId),
  )
  return orders.map((order) =>
    toOrderView(
      order,
      lines.filter((line) => line.orderId === order.id),
      items,
    ),
  )
}

export async function loadOrderView(db: DbOrTx, orderId: string): Promise<OrderView> {
  const order = await findOrder(db, orderId)
  if (!order) throw notFound('Order not found')
  const [view] = await loadOrderViews(db, [order])
  if (!view) throw notFound('Order not found')
  return view
}
