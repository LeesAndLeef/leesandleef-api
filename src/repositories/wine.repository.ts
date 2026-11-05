import { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lte, or, type SQL } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toWine } from '../lib/mappers.ts'
import type { WineSort, WineType } from '../types/content.ts'
import { when } from '../utils/when.ts'

export interface WineFilter {
  type?: WineType
  growerId?: string
  q?: string
  region?: string[]
  grape?: string[]
  priceMin?: number
  priceMax?: number
  maxSo2?: number
  so2Added?: boolean
  vegan?: boolean
  amphora?: boolean
  magnum?: boolean
  inStock?: boolean
  listed?: boolean
  sort?: WineSort
}

const ORDER: Record<WineSort, SQL> = {
  newest: asc(t.wines.releaseRank),
  'price-asc': asc(t.wines.price),
  'price-desc': desc(t.wines.price),
  left: asc(t.wines.left),
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&')

function matchesText(q: string) {
  const pattern = `%${escapeLike(q)}%`
  return or(
    ilike(t.wines.name, pattern),
    ilike(t.wines.growerName, pattern),
    ilike(t.wines.grape, pattern),
    ilike(t.wines.region, pattern),
  )
}

const startsWithAny = (prefixes: string[]) => or(...prefixes.map((p) => ilike(t.wines.grape, `${escapeLike(p)}%`)))

const inStock = (wanted: boolean) => (wanted ? or(isNull(t.wines.left), gt(t.wines.left, 0)) : eq(t.wines.left, 0))

const nonEmpty = <T>(values: T[] | undefined) => (values?.length ? values : undefined)

function conditions(filter: WineFilter) {
  return [
    when(filter.type, (type) => eq(t.wines.type, type)),
    when(filter.growerId, (id) => eq(t.wines.growerId, id)),
    when(filter.q?.trim() || undefined, matchesText),
    when(nonEmpty(filter.region), (regions) => inArray(t.wines.region, regions)),
    when(nonEmpty(filter.grape), startsWithAny),
    when(filter.priceMin, (min) => gte(t.wines.price, min)),
    when(filter.priceMax, (max) => lte(t.wines.price, max)),
    when(filter.maxSo2, (max) => lte(t.wines.so2, max)),
    when(filter.so2Added, (added) => eq(t.wines.so2Added, added)),
    when(filter.vegan, (vegan) => eq(t.wines.vegan, vegan)),
    when(filter.amphora, (amphora) => eq(t.wines.amphora, amphora)),
    when(filter.magnum, (magnum) => eq(t.wines.magnum, magnum)),
    when(filter.inStock, inStock),
    when(filter.listed, (listed) => eq(t.wines.unlisted, !listed)),
  ]
}

export async function findWines(db: DbOrTx, filter: WineFilter = {}) {
  const rows = await db
    .select()
    .from(t.wines)
    .where(and(...conditions(filter)))
    .orderBy(...(filter.sort ? [ORDER[filter.sort]] : []), asc(t.wines.position))
  return rows.map(toWine)
}

export async function findWine(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.wines).where(eq(t.wines.id, id))
  return row && toWine(row)
}
