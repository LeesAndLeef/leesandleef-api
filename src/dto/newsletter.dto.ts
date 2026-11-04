import type { FastifySchema } from 'fastify'
import { z } from 'zod'

export const subscribeSchema = {
  tags: ['newsletter'],
  summary: 'Subscribe to release letters (idempotent)',
  body: z.object({
    email: z.email().max(254),
    source: z.enum(['footer', 'article', 'checkout']).default('footer'),
  }),
  response: { 201: z.object({ subscribed: z.literal(true) }) },
} satisfies FastifySchema
