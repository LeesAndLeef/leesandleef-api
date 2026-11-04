import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { WINE_TYPES } from '../config/constants.ts'

const idParams = z.object({ id: z.string().min(1) })

export const getSiteSchema = { tags: ['site'], summary: 'Shop details' } satisfies FastifySchema

export const listWinesSchema = {
  tags: ['wines'],
  summary: 'All wines, including unlisted ones (flagged with unlisted: true)',
  querystring: z.object({ type: z.enum(WINE_TYPES).optional(), growerId: z.string().optional() }),
} satisfies FastifySchema

export const getWineSchema = { tags: ['wines'], params: idParams } satisfies FastifySchema

export const listOilsSchema = {
  tags: ['oils'],
  summary: 'All olive oils, including tasting sets (they carry a set field)',
  querystring: z.object({ growerId: z.string().optional() }),
} satisfies FastifySchema

export const getOilSchema = { tags: ['oils'], params: idParams } satisfies FastifySchema

export const listClubPlansSchema = { tags: ['club'] } satisfies FastifySchema

export const listGrowersSchema = { tags: ['growers'] } satisfies FastifySchema

export const getGrowerSchema = { tags: ['growers'], params: idParams } satisfies FastifySchema

export const listArticlesSchema = { tags: ['articles'] } satisfies FastifySchema

export const getArticleSchema = {
  tags: ['articles'],
  params: z.object({ slug: z.string().min(1) }),
} satisfies FastifySchema
