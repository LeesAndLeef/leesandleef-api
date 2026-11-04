import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { MAX_LINE_QTY, SHIP_METHODS } from '../config/constants.ts'
import type { CartItemSummary } from '../types/cart.ts'

const cartItemSchema = z.looseObject({
  kind: z.enum(['wine', 'oil', 'club']),
  id: z.string(),
  name: z.string(),
}) as unknown as z.ZodType<CartItemSummary>

export const pricedLineSchema = z.object({
  key: z.string(),
  id: z.string(),
  option: z.string().optional(),
  qty: z.number().int(),
  kind: z.enum(['wine', 'oil', 'club']),
  item: cartItemSchema,
  name: z.string(),
  meta: z.string(),
  unit: z.number(),
  total: z.number(),
  isWine: z.boolean(),
  isClub: z.boolean(),
  maxQty: z.number().int(),
  glass: z.string(),
})

export const totalsSchema = z.object({
  count: z.number().int(),
  wineBottles: z.number().int(),
  subtotal: z.number(),
  mixDiscount: z.number(),
  promoDiscount: z.number(),
  goodsAfter: z.number(),
  shipping: z.number(),
  total: z.number(),
})

export const cartSchema = z.object({
  id: z.uuid().nullable(),
  lines: z.array(pricedLineSchema),
  saved: z.array(pricedLineSchema),
  promo: z.string().nullable(),
  giftNote: z.string().nullable(),
  totals: totalsSchema,
})

export const shipOptionSchema = z.object({
  id: z.enum(SHIP_METHODS),
  name: z.string(),
  desc: z.string(),
  price: z.number(),
})

export const keyParams = z.object({ key: z.string().min(1).max(100) })

export const addLineBody = z.object({
  id: z.string().min(1),
  qty: z.number().int().min(1).max(MAX_LINE_QTY).default(1),
  option: z.string().min(1).optional(),
})

export const qtyBody = z.object({ qty: z.number().int().min(1).max(MAX_LINE_QTY) })

export const promoBody = z.object({ code: z.string().trim().min(1).max(40) })

export const giftNoteBody = z.object({ note: z.string().max(300).nullable() })

const tags = ['cart']
const response = { 200: cartSchema }

export const getCartSchema = { tags, summary: 'The current cart, priced', response } satisfies FastifySchema

export const getShippingOptionsSchema = {
  tags,
  summary: 'Delivery options and prices for the current cart',
  response: { 200: z.array(shipOptionSchema) },
} satisfies FastifySchema

export const addLineSchema = {
  tags,
  summary: 'Add a product or club plan. option is a vintage year, an oil size or a club frequency',
  body: addLineBody,
  response,
} satisfies FastifySchema

export const setQtySchema = {
  tags,
  summary: 'Change a line quantity',
  params: keyParams,
  body: qtyBody,
  response,
} satisfies FastifySchema

export const removeLineSchema = { tags, summary: 'Remove a line', params: keyParams, response } satisfies FastifySchema

export const saveForLaterSchema = {
  tags,
  summary: 'Move a line to the saved list',
  params: keyParams,
  response,
} satisfies FastifySchema

export const moveToCartSchema = {
  tags,
  summary: 'Move a saved line back into the cart',
  params: keyParams,
  response,
} satisfies FastifySchema

export const removeSavedSchema = {
  tags,
  summary: 'Remove a saved line',
  params: keyParams,
  response,
} satisfies FastifySchema

export const applyPromoSchema = {
  tags,
  summary: 'Apply a promo code (422 if unknown)',
  body: promoBody,
  response,
} satisfies FastifySchema

export const removePromoSchema = { tags, summary: 'Remove the promo code', response } satisfies FastifySchema

export const setGiftNoteSchema = {
  tags,
  summary: 'Set or clear the gift note',
  body: giftNoteBody,
  response,
} satisfies FastifySchema

export const clearCartSchema = {
  tags,
  summary: 'Empty the cart (saved items stay)',
  response,
} satisfies FastifySchema
