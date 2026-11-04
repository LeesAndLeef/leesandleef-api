import type { Db } from '../db/client.ts'
import type { PlaceOrderInput } from '../dto/order.dto.ts'
import { newOrderNumber } from '../lib/orderNumber.ts'
import type { OrderView } from '../lib/orderView.ts'
import { shippingOptions } from '../lib/pricing.ts'
import * as repo from '../repositories/order.repository.ts'
import { findSite } from '../repositories/site.repository.ts'
import { updateUser } from '../repositories/user.repository.ts'
import type { CartState } from '../types/cart.ts'
import type { Deps } from '../types/deps.ts'
import type { PaymentInstructions } from '../types/order.ts'
import { conflict, HttpError, notFound, unprocessable } from '../utils/errors.ts'
import { roundMoney, toCents } from '../utils/money.ts'
import { addressColumns, requireUser } from './account.service.ts'
import { emptied, priceCart, settleCart } from './cart.service.ts'
import { sendOrderConfirmation } from './email.service.ts'
import { subscribe } from './newsletter.service.ts'
import { loadOrderView, loadOrderViews } from './orderView.service.ts'
import { confirmPayment, syncPayment } from './payment.service.ts'

export interface PlacedOrder {
  order: OrderView
  payment: PaymentInstructions
  cart: CartState
}

const normalizeCountry = (country: string) => country.replace(/^the /i, '').toLowerCase()

function createOrder(db: Db, userId: string, state: CartState, input: PlaceOrderInput, bankEnabled: boolean) {
  return db.transaction(async (tx) => {
    const user = await requireUser(tx, userId)
    const settled = await settleCart(tx, state)
    const cart = await priceCart(tx, settled)
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
    const phone = input.details.phone || null

    const order = await repo.insertOrder(
      tx,
      {
        number: newOrderNumber(),
        status: input.pay === 'bank' ? 'awaiting_transfer' : 'pending_payment',
        userId,
        firstName: input.details.first,
        lastName: input.details.last,
        email: user.email,
        phone,
        shipMethod: input.ship,
        ...addressColumns(address ?? null),
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

    await updateUser(tx, userId, {
      firstName: input.details.first,
      lastName: input.details.last,
      ...(phone && { phone }),
      ...(address && addressColumns(address)),
    })
    if (input.details.news) await subscribe(tx, order.email, 'checkout')
    return { order, state: settled }
  })
}

export async function placeOrder(
  deps: Deps,
  userId: string,
  cartState: CartState,
  input: PlaceOrderInput,
): Promise<PlacedOrder> {
  const { db, payments, config } = deps
  const { order, state } = await createOrder(db, userId, cartState, input, config.bank !== null)

  if (order.status === 'awaiting_transfer' && config.bank) {
    await sendOrderConfirmation(deps, order.id)
    return {
      order: await loadOrderView(db, order.id),
      payment: { method: 'bank', ...config.bank, reference: order.number, amount: order.total },
      cart: emptied(state),
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
    return { order: await loadOrderView(db, order.id), payment: { method: 'none' }, cart: emptied(state) }
  }
  if (!payment.clientSecret) throw new HttpError(502, 'Payment provider returned no client secret')
  return {
    order: await loadOrderView(db, order.id),
    payment: { method: 'stripe', clientSecret: payment.clientSecret },
    cart: { ...state, pendingOrderId: order.id },
  }
}

export async function listOrders(db: Db, userId: string) {
  return loadOrderViews(db, await repo.findOrdersByUser(db, userId))
}

export async function getOrderForUser(deps: Deps, userId: string, orderId: string) {
  const order = await repo.findOrder(deps.db, orderId)
  if (!order || order.userId !== userId) throw notFound('Order not found')
  if (order.status === 'pending_payment' && order.paymentIntentId) await syncPayment(deps, order.paymentIntentId)
  return loadOrderView(deps.db, orderId)
}
