import type { FastifyRequest } from 'fastify'
import { cancelPayment, confirmPayment } from '../services/payment.service.ts'
import { HttpError } from '../utils/errors.ts'

export async function stripeWebhook(req: FastifyRequest) {
  const signature = req.headers['stripe-signature']
  if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) throw new HttpError(400, 'Missing Stripe signature')
  const event = req.server.payments.parseWebhook(req.body, signature)
  if (event?.type === 'succeeded') await confirmPayment(req.server, event.paymentId, event.amountCents)
  if (event?.type === 'canceled') await cancelPayment(req.server, event.paymentId)
  if (event?.type === 'failed') req.log.info({ paymentId: event.paymentId, reason: event.reason }, 'Payment failed')
  return { received: true }
}
