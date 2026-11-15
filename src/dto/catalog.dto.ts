import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { OIL_LEVELS, WINE_SORTS, WINE_TYPES } from '../config/constants.ts'
import type { Oil, Wine } from '../types/content.ts'

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

const countsBy = <K extends string>(keys: readonly [K, ...K[]]) => z.record(z.enum(keys), z.number().int())

const wineListMeta = z.object({
  total: z.number().int().describe('Wines in data'),
  types: countsBy(WINE_TYPES).describe('Wines per type with every filter except type'),
  regions: z.record(z.string(), z.number().int()).describe('Wines per region with every filter except region'),
  price: z
    .object({ min: z.number(), max: z.number() })
    .nullable()
    .describe('Lowest and highest price with every filter except price; null when nothing matches'),
})

const oilListMeta = z.object({
  total: z.number().int().describe('Oils in data'),
  levels: countsBy(OIL_LEVELS).describe('Oils per intensity with every filter except level'),
})

export const listWinesSchema = {
  tags: ['wines'],
  summary:
    'Wines, filtered and sorted, with counts for the filter controls in meta. Without parameters: every wine, unlisted ones flagged with unlisted: true. Each wine lists its vintages, the products you can buy',
  querystring: z.object({
    type: z.enum(WINE_TYPES).optional(),
    growerId: z.string().optional(),
    q: z.string().trim().max(100).optional().describe('Text in the name, grower, grape or region'),
    region: list('Regions, e.g. Istria'),
    grape: list('Grapes; a wine matches when its grape starts with one of them, e.g. Malvazija'),
    priceMin: price('Lowest price of the default vintage, in euros'),
    priceMax: price('Highest price of the default vintage, in euros'),
    maxSo2: z.coerce.number().int().min(0).optional().describe('Highest total SO₂ in mg/L'),
    so2Added: flag('false: only wines with zero added SO₂'),
    vegan: flag('true: only vegan (unfined) wines'),
    amphora: flag('true: only amphora-aged wines'),
    magnum: flag('true: only wines with a magnum'),
    inStock: flag('true: hide wines whose default vintage is sold out; false: only those'),
    listed: flag('true: hide unlisted wines (what the shop shows)'),
    sort: z
      .enum(WINE_SORTS)
      .optional()
      .describe('Default and newest: latest releaseDate first. Price and left use the default vintage'),
  }),
  response: { 200: z.object({ data: z.array(z.custom<Wine>()), meta: wineListMeta }) },
} satisfies FastifySchema

export const getWineSchema = { tags: ['wines'], params: idParams } satisfies FastifySchema

export const listOilsSchema = {
  tags: ['oils'],
  summary:
    'Olive oils, filtered, with counts per intensity in meta. Without parameters: every oil, tasting sets included (they carry a set field)',
  querystring: z.object({
    growerId: z.string().optional(),
    level: z.enum(OIL_LEVELS).optional(),
    set: flag('false: hide tasting sets (what the shop shows); true: only tasting sets'),
  }),
  response: { 200: z.object({ data: z.array(z.custom<Oil>()), meta: oilListMeta }) },
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
