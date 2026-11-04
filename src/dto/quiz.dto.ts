import type { FastifySchema } from 'fastify'
import { z } from 'zod'

export const getQuizSchema = { tags: ['quiz'], summary: 'Quiz questions and result profiles' } satisfies FastifySchema

export const recommendSchema = {
  tags: ['quiz'],
  summary: 'Score quiz answers and recommend a mixed six',
  body: z.object({ answers: z.array(z.number().int().min(0)).max(50) }),
} satisfies FastifySchema
