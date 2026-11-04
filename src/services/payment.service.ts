import { findOrderByPayment, transition } from '../repositories/order.repository.ts'
import type { Deps } from '../types/deps.ts'
import { toCents } from '../utils/money.ts'
import { clearCart } from './cart.service.ts'
import { sendOrderConfirmation } from './email.service.ts'

export async function confirmPayment(deps: Deps, paymentId: string, amountCents: number) {
  const order = await findOrderByPayment(deps.db, paymentId)
  if (!order) return deps.log.warn({ paymentId }, 'Payment for an unknown order')
  if (amountCents !== toCents(order.total)) {
    return deps.log.error({ paymentId, amountCents, orderId: order.id }, 'Payment amount does not match order total')
  }
  const paid = await deps.db.transaction(async (tx) => {
    const updated = await transition(tx, order.id, 'pending_payment', 'paid')
    if (updated?.cartId) await clearCart(tx, updated.cartId)
    return updated
  })
  if (paid) await sendOrderConfirmation(deps, order.id)
}

export async function cancelPayment(deps: Deps, paymentId: string) {
  const order = await findOrderByPayment(deps.db, paymentId)
  if (order) await transition(deps.db, order.id, 'pending_payment', 'cancelled')
}

export async function syncPayment(deps: Deps, paymentId: string) {
  const payment = await deps.payments.retrievePayment(paymentId)
  if (payment.status === 'succeeded') await confirmPayment(deps, payment.id, payment.amountCents)
  if (payment.status === 'canceled') await cancelPayment(deps, payment.id)
}
