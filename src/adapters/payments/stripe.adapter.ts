import Stripe from 'stripe'
import { CURRENCY } from '../../config/constants.ts'
import { HttpError } from '../../utils/errors.ts'
import type { Payment, PaymentEvent, PaymentProvider } from './payment.adapter.ts'

function toStatus(intent: Stripe.PaymentIntent): Payment['status'] {
  if (intent.status === 'succeeded') return 'succeeded'
  if (intent.status === 'canceled') return 'canceled'
  return 'pending'
}

const toPayment = (intent: Stripe.PaymentIntent) => ({
  id: intent.id,
  clientSecret: intent.client_secret,
  status: toStatus(intent),
  amountCents: intent.amount_received,
})

export function createStripePayments({
  secretKey,
  webhookSecret,
}: {
  secretKey: string
  webhookSecret: string
}): PaymentProvider {
  const stripe = new Stripe(secretKey)

  return {
    name: 'stripe',

    async createPayment({ orderId, orderNumber, amountCents }) {
      const intent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: CURRENCY.toLowerCase(),
          automatic_payment_methods: { enabled: true },
          description: `Lees & Leaf order ${orderNumber}`,
          metadata: { orderId, orderNumber },
        },
        { idempotencyKey: `order-${orderId}` },
      )
      return toPayment(intent)
    },

    async retrievePayment(paymentId) {
      return toPayment(await stripe.paymentIntents.retrieve(paymentId))
    },

    parseWebhook(payload, signature): PaymentEvent | null {
      let event: Stripe.Event
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      } catch {
        throw new HttpError(400, 'Invalid Stripe signature')
      }
      switch (event.type) {
        case 'payment_intent.succeeded':
          return { type: 'succeeded', paymentId: event.data.object.id, amountCents: event.data.object.amount_received }
        case 'payment_intent.canceled':
          return { type: 'canceled', paymentId: event.data.object.id }
        case 'payment_intent.payment_failed':
          return {
            type: 'failed',
            paymentId: event.data.object.id,
            reason: event.data.object.last_payment_error?.message,
          }
        default:
          return null
      }
    },
  }
}
