import { PAY_NAMES, SHIP_DETAILS } from '../config/constants.ts'
import type { OrderLineRow, OrderRow } from '../repositories/order.repository.ts'
import type { CartItem } from '../types/content.ts'
import { summarize } from './pricing.ts'

export function shipTo(order: Pick<OrderRow, 'shipMethod' | 'street' | 'postcode' | 'city' | 'country'>) {
  if (order.shipMethod === 'pick') return SHIP_DETAILS.pick.name
  return `${order.street}, ${order.postcode} ${order.city}, ${order.country}`
}

function lineView(line: OrderLineRow, item: CartItem | undefined) {
  return {
    key: line.option ? `${line.itemId}@${line.option}` : line.itemId,
    id: line.itemId,
    ...(line.option !== null && { option: line.option }),
    qty: line.qty,
    kind: line.kind,
    name: line.name,
    meta: line.meta,
    unit: line.unit,
    total: line.total,
    isWine: line.kind === 'wine',
    isClub: line.kind === 'club',
    ...(item && { item: summarize(item), glass: item.kind === 'club' ? 'var(--wine)' : item.glass }),
  }
}

export function toOrderView(order: OrderRow, lines: OrderLineRow[], items: Map<string, CartItem>) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    firstName: order.firstName,
    email: order.email,
    shipName: SHIP_DETAILS[order.shipMethod].name,
    payName: PAY_NAMES[order.payMethod],
    shipTo: shipTo(order),
    giftNote: order.giftNote,
    promo: order.promo,
    lines: lines.map((line) => lineView(line, items.get(line.itemId))),
    totals: {
      subtotal: order.subtotal,
      mixDiscount: order.mixDiscount,
      promoDiscount: order.promoDiscount,
      shipping: order.shipping,
      total: order.total,
    },
    total: order.total,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  }
}

export type OrderView = ReturnType<typeof toOrderView>
