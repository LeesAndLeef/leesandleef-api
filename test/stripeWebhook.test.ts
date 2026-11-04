import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import { createStripePayments } from '../src/adapters/payments/stripe.adapter.ts'

const webhookSecret = 'whsec_test_secret'
const payments = createStripePayments({ secretKey: 'sk_test_unused', webhookSecret })

function signed(type: string, object: object) {
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type, data: { object } })
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret })
  return [Buffer.from(payload), signature] as const
}

describe('Stripe webhook parsing', () => {
  it('maps a succeeded payment intent', () => {
    const event = payments.parseWebhook(...signed('payment_intent.succeeded', { id: 'pi_1', amount_received: 12654 }))
    expect(event).toEqual({ type: 'succeeded', paymentId: 'pi_1', amountCents: 12654 })
  })

  it('ignores unrelated events', () => {
    expect(payments.parseWebhook(...signed('customer.created', { id: 'cus_1' }))).toBeNull()
  })

  it('rejects a bad signature', () => {
    const [payload] = signed('payment_intent.succeeded', { id: 'pi_1', amount_received: 1 })
    expect(() => payments.parseWebhook(payload, 't=1,v1=bad')).toThrow('Invalid Stripe signature')
  })
})
