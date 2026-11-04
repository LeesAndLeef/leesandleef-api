import type { FastifySchema } from 'fastify'
import { z } from 'zod'

export const searchSchema = {
  tags: ['search'],
  summary: 'Accent-insensitive search across wines, oils and growers',
  querystring: z.object({ q: z.string().trim().min(1).max(100) }),
} satisfies FastifySchema
