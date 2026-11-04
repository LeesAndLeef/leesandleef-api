import { inArray } from 'drizzle-orm'
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
const buyer = { email: 'buyer@example.com', password: 'correct horse battery', firstName: 'Test', lastName: 'Buyer' }
const other = { ...buyer, email: 'other@example.com' }
const address = { street: 'Ulica 1', postcode: '52100', city: 'Pula', country: 'Croatia' }

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

function browser(app: () => Awaited<ReturnType<typeof buildApp>>) {
  const jar = new Map<string, string>()
  const request = async (method: Method, url: string, payload?: object) => {
    const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
    const res = await app().inject({ method, url, payload, headers: { cookie } })
    for (const set of res.cookies) {
      if (set.maxAge === 0 || (set.expires && set.expires.getTime() <= Date.now())) jar.delete(set.name)
      else jar.set(set.name, set.value)
    }
    return res
  }
  return { request, jar }
}

describe.skipIf(!url)('accounts and checkout', () => {
  const { db, pool } = createDb(url ?? '')
  const sent: Mail[] = []
  const stripe = createStripePayments({ secretKey: 'sk_test_unused', webhookSecret })
  const payments: PaymentProvider = {
    ...stripe,
    createPayment: async ({ orderId }) => ({ id: `pi_${orderId}`, clientSecret: 'secret_123', status: 'pending' }),
    retrievePayment: async (id) => ({ id, clientSecret: 'secret_123', status: 'pending', amountCents: 0 }),
  }
  let app: Awaited<ReturnType<typeof buildApp>>
  const customer = browser(() => app)
  const stranger = browser(() => app)
  let orderId = ''

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
    await db.delete(t.users).where(inArray(t.users.email, [buyer.email, other.email]))
    app = await buildApp({
      db,
      corsOrigin: [],
      config: {
        secureCookies: false,
        jwtSecret: 'test-jwt-secret-that-is-long-enough-123',
        cookieSecret: 'test-cookie-secret-that-is-long-enough',
        bank: null,
      },
      payments,
      mailer: { send: async (mail) => void sent.push(mail) },
    })
  })

  afterAll(async () => {
    await db.delete(t.orders).where(inArray(t.orders.email, [buyer.email, other.email]))
    await db.delete(t.users).where(inArray(t.users.email, [buyer.email, other.email]))
    await app.close()
    await pool.end()
  })

  it('keeps a guest cart in a signed cookie', async () => {
    const added = await customer.request('POST', '/api/v1/cart/lines', { id: 'teran-crvena-zemlja', qty: 6 })
    expect(added.statusCode).toBe(200)
    expect(added.json().totals.wineBottles).toBe(6)
    expect(customer.jar.has('cart')).toBe(true)

    const forged = await app.inject({ method: 'GET', url: '/api/v1/cart', headers: { cookie: 'cart=eyJsIjpbXX0.bad' } })
    expect(forged.json().lines).toHaveLength(0)
  })

  it('requires an account to check out', async () => {
    const res = await customer.request('POST', '/api/v1/orders', { details: { first: 'A', last: 'B', age: true } })
    expect(res.statusCode).toBe(401)
  })

  it('signs up, rejects duplicates and wrong passwords', async () => {
    const created = await customer.request('POST', '/api/v1/auth/signup', buyer)
    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({ email: buyer.email, address: null })
    expect(customer.jar.has('session')).toBe(true)

    expect((await stranger.request('POST', '/api/v1/auth/signup', buyer)).statusCode).toBe(409)
    const wrong = await stranger.request('POST', '/api/v1/auth/login', { email: buyer.email, password: 'nope' })
    expect(wrong.statusCode).toBe(401)
  })

  it('keeps the cart until the webhook confirms payment, then emails once', async () => {
    const placed = await customer.request('POST', '/api/v1/orders', {
      details: { first: 'Test', last: 'Buyer', age: true },
      ship: 'std',
      address,
      pay: 'card',
    })
    expect(placed.statusCode).toBe(201)
    const { order, payment } = placed.json()
    orderId = order.id
    expect(payment).toEqual({ method: 'stripe', clientSecret: 'secret_123' })
    expect(order).toMatchObject({ status: 'pending_payment', email: buyer.email })
    expect((await customer.request('GET', '/api/v1/cart')).json().lines).toHaveLength(1)

    const paymentId = `pi_${order.id}`
    expect((await webhook(paymentId, 1)).statusCode).toBe(200)
    expect((await customer.request('GET', `/api/v1/orders/${order.id}`)).json().status).toBe('pending_payment')

    const cents = Math.round(order.total * 100)
    expect((await webhook(paymentId, cents)).statusCode).toBe(200)
    expect((await webhook(paymentId, cents)).statusCode).toBe(200)

    const paid = (await customer.request('GET', `/api/v1/orders/${order.id}`)).json()
    expect(paid.status).toBe('paid')
    expect(paid.paidAt).not.toBeNull()
    expect((await customer.request('GET', '/api/v1/cart')).json().lines).toHaveLength(0)
    expect(sent.filter((mail) => mail.subject.includes(order.number))).toHaveLength(1)
  })

  it('saves the delivery address and lists the customer’s orders', async () => {
    expect((await customer.request('GET', '/api/v1/account')).json().address).toEqual(address)
    const orders = (await customer.request('GET', '/api/v1/orders')).json()
    expect(orders.map((order: { id: string }) => order.id)).toEqual([orderId])

    const updated = await customer.request('PATCH', '/api/v1/account', { phone: '+385 1 234', address: null })
    expect(updated.json()).toMatchObject({ phone: '+385 1 234', address: null })
  })

  it('hides orders from other accounts and logs out', async () => {
    expect((await stranger.request('POST', '/api/v1/auth/signup', other)).statusCode).toBe(201)
    expect((await stranger.request('GET', `/api/v1/orders/${orderId}`)).statusCode).toBe(404)

    expect((await customer.request('POST', '/api/v1/auth/logout')).statusCode).toBe(204)
    expect((await customer.request('GET', '/api/v1/account')).statusCode).toBe(401)
    expect((await customer.request('POST', '/api/v1/auth/login', buyer)).statusCode).toBe(200)
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
