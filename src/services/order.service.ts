import type { Db } from '../db/client.ts'
import type { PlaceOrderInput } from '../dto/order.dto.ts'
import { newOrderNumber } from '../lib/orderNumber.ts'
import type { OrderView } from '../lib/orderView.ts'
import { shippingOptions } from '../lib/pricing.ts'
import * as repo from '../repositories/order.repository.ts'
import { findSite } from '../repositories/site.repository.ts'
import type { Deps } from '../types/deps.ts'
import type { PaymentInstructions } from '../types/order.ts'
import { conflict, HttpError, notFound, unprocessable } from '../utils/errors.ts'
import { roundMoney, toCents } from '../utils/money.ts'
import { clearCart, loadPricedCart } from './cart.service.ts'
import { sendOrderConfirmation } from './email.service.ts'
import { subscribe } from './newsletter.service.ts'
import { loadOrderView } from './orderView.service.ts'
import { confirmPayment, syncPayment } from './payment.service.ts'

const normalizeCountry = (country: string) => country.replace(/^the /i, '').toLowerCase()

function createOrder(db: Db, cartId: string, input: PlaceOrderInput, bankEnabled: boolean) {
  return db.transaction(async (tx) => {
    const cart = await loadPricedCart(tx, cartId)
    if (cart.lines.length === 0) throw conflict('Your cart is empty')
    if (input.pay === 'bank' && !bankEnabled) throw unprocessable('Bank transfer isn’t available right now')

    const address = input.ship === 'pick' ? undefined : input.address
    if (address) {
      const site = await findSite(tx)
      if (!site.shipCountries.map(normalizeCountry).includes(normalizeCountry(address.country))) {
        throw unprocessable(`We don’t ship to ${address.country} yet`)
      }
    }

    const delivery = shippingOptions(cart.totals).find((option) => option.id === input.ship)
    if (!delivery) throw unprocessable(`Unknown delivery option ${input.ship}`)
    const total = roundMoney(cart.totals.total - cart.totals.shipping + delivery.price)

    const order = await repo.insertOrder(
      tx,
      {
        number: newOrderNumber(),
        status: input.pay === 'bank' ? 'awaiting_transfer' : 'pending_payment',
        cartId,
        firstName: input.details.first,
        lastName: input.details.last,
        email: input.details.email.toLowerCase(),
        phone: input.details.phone || null,
        shipMethod: input.ship,
        street: address?.street ?? null,
        postcode: address?.postcode ?? null,
        city: address?.city ?? null,
        country: address?.country ?? null,
        door: address?.door || null,
        payMethod: input.pay,
        giftNote: cart.giftNote,
        promo: cart.promo,
        subtotal: cart.totals.subtotal,
        mixDiscount: cart.totals.mixDiscount,
        promoDiscount: cart.totals.promoDiscount,
        shipping: delivery.price,
        total,
      },
      cart.lines.map((line, position) => ({
        position,
        itemId: line.id,
        kind: line.kind,
        option: line.option ?? null,
        name: line.name,
        meta: line.meta,
        unit: line.unit,
        qty: line.qty,
        total: line.total,
      })),
    )

    if (input.details.news) await subscribe(tx, order.email, 'checkout')
    if (order.status === 'awaiting_transfer') await clearCart(tx, cartId)
    return order
  })
}

export async function placeOrder(
  deps: Deps,
  cartId: string,
  input: PlaceOrderInput,
): Promise<{ order: OrderView; payment: PaymentInstructions }> {
  const { db, payments, config } = deps
  const order = await createOrder(db, cartId, input, config.bank !== null)

  if (order.status === 'awaiting_transfer' && config.bank) {
    await sendOrderConfirmation(deps, order.id)
    return {
      order: await loadOrderView(db, order.id),
      payment: { method: 'bank', ...config.bank, reference: order.number, amount: order.total },
    }
  }

  const amountCents = toCents(order.total)
  let payment: Awaited<ReturnType<typeof payments.createPayment>>
  try {
    payment = await payments.createPayment({ orderId: order.id, orderNumber: order.number, amountCents })
  } catch (error) {
    deps.log.error({ err: error, orderId: order.id }, 'Could not create payment')
    await repo.transition(db, order.id, 'pending_payment', 'cancelled')
    throw new HttpError(502, 'Payment provider is unavailable, please try again')
  }
  await repo.setPaymentIntent(db, order.id, payment.id)

  if (payment.status === 'succeeded') {
    await confirmPayment(deps, payment.id, amountCents)
    return { order: await loadOrderView(db, order.id), payment: { method: 'none' } }
  }
  if (!payment.clientSecret) throw new HttpError(502, 'Payment provider returned no client secret')
  return {
    order: await loadOrderView(db, order.id),
    payment: { method: 'stripe', clientSecret: payment.clientSecret },
  }
}

export async function getOrderForCart(deps: Deps, cartId: string | null, orderId: string) {
  const order = await repo.findOrder(deps.db, orderId)
  if (!order || !cartId || order.cartId !== cartId) throw notFound('Order not found')
  if (order.status === 'pending_payment' && order.paymentIntentId) await syncPayment(deps, order.paymentIntentId)
  return loadOrderView(deps.db, orderId)
}
