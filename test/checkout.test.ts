import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Mail } from '../src/adapters/email/mailer.adapter.ts'
import type { PaymentProvider } from '../src/adapters/payments/payment.adapter.ts'
import { createStripePayments } from '../src/adapters/payments/stripe.adapter.ts'
import { buildApp } from '../src/app.ts'
import { createDb } from '../src/db/client.ts'
import * as t from '../src/db/schema.ts'

const url = process.env.DATABASE_URL
const webhookSecret = 'whsec_test_secret'
const buyer = 'buyer@example.com'

describe.skipIf(!url)('checkout with card payment', () => {
  const { db, pool } = createDb(url ?? '')
  const sent: Mail[] = []
  const stripe = createStripePayments({ secretKey: 'sk_test_unused', webhookSecret })
  const payments: PaymentProvider = {
    ...stripe,
    createPayment: async ({ orderId }) => ({ id: `pi_${orderId}`, clientSecret: 'secret_123', status: 'pending' }),
    retrievePayment: async (id) => ({ id, clientSecret: 'secret_123', status: 'pending', amountCents: 0 }),
  }
  let app: Awaited<ReturnType<typeof buildApp>>
  let cookie = ''

  const call = async (method: 'GET' | 'POST', url: string, payload?: object, headers: Record<string, string> = {}) => {
    const res = await app.inject({ method, url, payload, headers: { cookie, ...headers } })
    const setCookie = res.headers['set-cookie']
    if (setCookie) cookie = String(setCookie).split(';')[0] ?? ''
    return res
  }

  const webhook = (paymentId: string, amountCents: number) => {
    const payload = JSON.stringify({
      id: 'evt_1',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: paymentId, amount_received: amountCents } },
    })
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret })
    return app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload,
      headers: { 'content-type': 'application/json', 'stripe-signature': signature },
    })
  }

  beforeAll(async () => {
    app = await buildApp({
      db,
      corsOrigin: [],
      config: { secureCookies: false, bank: null },
      payments,
      mailer: { send: async (mail) => void sent.push(mail) },
    })
  })

  afterAll(async () => {
    await db.delete(t.orders).where(eq(t.orders.email, buyer))
    const cartId = cookie.split('=')[1]
    if (cartId) await db.delete(t.carts).where(eq(t.carts.id, cartId))
    await app.close()
    await pool.end()
  })

  it('keeps the cart until the webhook confirms payment, then emails once', async () => {
    await call('POST', '/api/v1/cart/lines', { id: 'teran-crvena-zemlja', qty: 6 })
    const placed = await call('POST', '/api/v1/orders', {
      details: { first: 'Test', last: 'Buyer', email: buyer, age: true },
      ship: 'pick',
      pay: 'card',
    })
    expect(placed.statusCode).toBe(201)
    const { order, payment } = placed.json()
    expect(payment).toEqual({ method: 'stripe', clientSecret: 'secret_123' })
    expect(order.status).toBe('pending_payment')
    expect((await call('GET', '/api/v1/cart')).json().lines).toHaveLength(1)

    const paymentId = `pi_${order.id}`
    expect((await webhook(paymentId, 1)).statusCode).toBe(200)
    expect((await call('GET', `/api/v1/orders/${order.id}`)).json().status).toBe('pending_payment')

    const cents = Math.round(order.total * 100)
    expect((await webhook(paymentId, cents)).statusCode).toBe(200)
    expect((await webhook(paymentId, cents)).statusCode).toBe(200)

    const paid = (await call('GET', `/api/v1/orders/${order.id}`)).json()
    expect(paid.status).toBe('paid')
    expect(paid.paidAt).not.toBeNull()
    expect((await call('GET', '/api/v1/cart')).json().lines).toHaveLength(0)
    expect(sent.filter((mail) => mail.subject.includes(order.number))).toHaveLength(1)
  })

  it('hides orders from other carts', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/orders/00000000-0000-4000-8000-000000000000' })
    expect(res.statusCode).toBe(404)
  })

  it('rejects unsigned webhooks', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      payload: '{}',
      headers: { 'content-type': 'application/json' },
    })
    expect(res.statusCode).toBe(400)
  })
})
