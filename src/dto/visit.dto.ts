import type { FastifySchema } from 'fastify'
import { z } from 'zod'

export const requestVisitSchema = {
  tags: ['growers'],
  summary: 'Request a cellar visit with a grower',
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254),
    date: z.iso.date(),
    guests: z.number().int().min(1).max(12),
    notes: z.string().trim().max(2000).optional(),
  }),
  response: { 201: z.object({ id: z.uuid(), host: z.string(), date: z.string() }) },
} satisfies FastifySchema
