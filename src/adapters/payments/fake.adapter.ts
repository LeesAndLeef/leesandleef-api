import { HttpError } from '../../utils/errors.ts'
import type { PaymentProvider } from './payment.adapter.ts'

export function createFakePayments(): PaymentProvider {
  const amounts = new Map<string, number>()

  return {
    name: 'fake',

    async createPayment({ orderId, amountCents }) {
      const id = `fake_${orderId}`
      amounts.set(id, amountCents)
      return { id, clientSecret: null, status: 'succeeded' }
    },

    async retrievePayment(paymentId) {
      return { id: paymentId, clientSecret: null, status: 'succeeded', amountCents: amounts.get(paymentId) ?? 0 }
    },

    parseWebhook() {
      throw new HttpError(404, 'Payment webhooks are not configured: set STRIPE_SECRET_KEY')
    },
  }
}
