import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { OIL_LEVELS, WINE_SORTS, WINE_TYPES } from '../config/constants.ts'

const idParams = z.object({ id: z.string().min(1) })

export const getSiteSchema = { tags: ['site'], summary: 'Shop details' } satisfies FastifySchema

const list = (description: string) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((value) =>
      [value]
        .flat()
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .optional()
    .describe(`${description}. Repeat the parameter or separate values with commas`)

const flag = (description: string) => z.stringbool().optional().describe(description)

const price = (description: string) => z.coerce.number().min(0).optional().describe(description)

export const listWinesSchema = {
  tags: ['wines'],
  summary: 'Wines, filtered and sorted. Without parameters: every wine, unlisted ones flagged with unlisted: true',
  querystring: z.object({
    type: z.enum(WINE_TYPES).optional(),
    growerId: z.string().optional(),
    q: z.string().trim().max(100).optional().describe('Text in the name, grower, grape or region'),
    region: list('Regions, e.g. Istria'),
    grape: list('Grapes; a wine matches when its grape starts with one of them, e.g. Malvazija'),
    priceMin: price('Lowest price in euros'),
    priceMax: price('Highest price in euros'),
    maxSo2: z.coerce.number().int().min(0).optional().describe('Highest total SO₂ in mg/L'),
    so2Added: flag('false: only wines with zero added SO₂'),
    vegan: flag('true: only vegan (unfined) wines'),
    amphora: flag('true: only amphora-aged wines'),
    magnum: flag('true: only wines with a magnum'),
    inStock: flag('true: hide sold-out wines; false: only sold-out ones'),
    listed: flag('true: hide unlisted wines (what the shop shows)'),
    sort: z.enum(WINE_SORTS).optional().describe('Default: catalog order'),
  }),
} satisfies FastifySchema

export const getWineSchema = { tags: ['wines'], params: idParams } satisfies FastifySchema

export const listOilsSchema = {
  tags: ['oils'],
  summary: 'Olive oils, filtered. Without parameters: every oil, tasting sets included (they carry a set field)',
  querystring: z.object({
    growerId: z.string().optional(),
    level: z.enum(OIL_LEVELS).optional(),
    set: flag('false: hide tasting sets (what the shop shows); true: only tasting sets'),
  }),
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
