import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { ORDER_STATUSES, PAY_METHODS, SHIP_METHODS } from '../config/constants.ts'
import { pricedLineSchema } from './cart.dto.ts'

const text = (max = 120) => z.string().trim().min(1).max(max)

export const placeOrderBody = z
  .object({
    details: z.object({
      first: text(),
      last: text(),
      email: z.email().max(254),
      phone: z.string().trim().max(40).optional(),
      age: z.literal(true, { error: 'You must confirm you are 18 or older' }),
      news: z.boolean().default(false),
    }),
    ship: z.enum(SHIP_METHODS),
    address: z
      .object({
        street: text(200),
        postcode: text(20),
        city: text(),
        country: text(),
        door: z.string().trim().max(200).optional(),
      })
      .optional(),
    pay: z.enum(PAY_METHODS),
  })
  .refine((body) => body.ship === 'pick' || body.address, {
    error: 'A delivery address is required unless you collect at the cellar',
    path: ['address'],
  })

export type PlaceOrderInput = z.infer<typeof placeOrderBody>

const orderLineSchema = pricedLineSchema.omit({ maxQty: true }).partial({ item: true, glass: true })

export const orderSchema = z.object({
  id: z.uuid(),
  number: z.string(),
  status: z.enum(ORDER_STATUSES),
  firstName: z.string(),
  email: z.string(),
  shipName: z.string(),
  payName: z.string(),
  shipTo: z.string(),
  giftNote: z.string().nullable(),
  promo: z.string().nullable(),
  lines: z.array(orderLineSchema),
  totals: z.object({
    subtotal: z.number(),
    mixDiscount: z.number(),
    promoDiscount: z.number(),
    shipping: z.number(),
    total: z.number(),
  }),
  total: z.number(),
  createdAt: z.date(),
  paidAt: z.date().nullable(),
})

export const paymentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('stripe'), clientSecret: z.string() }),
  z.object({
    method: z.literal('bank'),
    beneficiary: z.string(),
    iban: z.string(),
    bic: z.string().optional(),
    reference: z.string(),
    amount: z.number(),
  }),
  z.object({ method: z.literal('none') }),
])

export const placedOrderSchema = z.object({ order: orderSchema, payment: paymentSchema })

export const placeOrderSchema = {
  tags: ['orders'],
  summary:
    'Place an order from the current cart. Card and wallet orders return a Stripe client secret and keep the cart until payment succeeds; bank orders return transfer details',
  body: placeOrderBody,
  response: { 201: placedOrderSchema },
} satisfies FastifySchema

export const getOrderSchema = {
  tags: ['orders'],
  summary: 'An order placed from the current cart. Pending card payments are re-checked with the provider',
  params: z.object({ id: z.uuid() }),
  response: { 200: orderSchema },
} satisfies FastifySchema
