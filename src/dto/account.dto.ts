import type { FastifySchema } from 'fastify'
import { z } from 'zod'

export const text = (max = 120) => z.string().trim().min(1).max(max)

export const phone = z.string().trim().max(40)

export const addressSchema = z.object({
  street: text(200),
  postcode: text(20),
  city: text(),
  country: text(),
  door: z.string().trim().max(200).optional(),
})

export const accountSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  address: addressSchema.nullable(),
})

const tags = ['account']
const security = [{ cookieAuth: [] }]

export const getAccountSchema = {
  tags,
  security,
  summary: 'The logged-in customer',
  response: { 200: accountSchema },
} satisfies FastifySchema

export const updateAccountSchema = {
  tags,
  security,
  summary: 'Change name, phone or default delivery address (null clears phone or address)',
  body: z.object({
    firstName: text().optional(),
    lastName: text().optional(),
    phone: phone.nullable().optional(),
    address: addressSchema.nullable().optional(),
  }),
  response: { 200: accountSchema },
} satisfies FastifySchema
