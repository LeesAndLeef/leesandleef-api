import { and, asc, count, desc, eq, gt, gte, ilike, inArray, isNull, lte, max, min, or, type SQL } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toWine } from '../lib/mappers.ts'
import type { SellableWine, Wine, WineSort, WineType, WineVintage } from '../types/content.ts'
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

type WineStyleRow = typeof t.wineStyles.$inferSelect
type WineProductRow = typeof t.wines.$inferSelect

const style = t.wineStyles
const defaultVintage = t.wines

const NEWEST = [desc(style.releaseDate), asc(style.id)]

const ORDER: Record<WineSort, SQL[]> = {
  newest: NEWEST,
  'price-asc': [asc(defaultVintage.price)],
  'price-desc': [desc(defaultVintage.price)],
  left: [asc(defaultVintage.left)],
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&')

function matchesText(q: string) {
  const pattern = `%${escapeLike(q)}%`
  return or(
    ilike(style.name, pattern),
    ilike(style.growerName, pattern),
    ilike(style.grape, pattern),
    ilike(style.region, pattern),
  )
}

const startsWithAny = (prefixes: string[]) => or(...prefixes.map((p) => ilike(style.grape, `${escapeLike(p)}%`)))

const inStock = (wanted: boolean) =>
  wanted ? or(isNull(defaultVintage.left), gt(defaultVintage.left, 0)) : eq(defaultVintage.left, 0)

const nonEmpty = <T>(values: T[] | undefined) => (values?.length ? values : undefined)

function conditions(filter: WineFilter) {
  return [
    when(filter.type, (type) => eq(style.type, type)),
    when(filter.growerId, (id) => eq(style.growerId, id)),
    when(filter.q?.trim() || undefined, matchesText),
    when(nonEmpty(filter.region), (regions) => inArray(style.region, regions)),
    when(nonEmpty(filter.grape), startsWithAny),
    when(filter.priceMin, (min) => gte(defaultVintage.price, min)),
    when(filter.priceMax, (max) => lte(defaultVintage.price, max)),
    when(filter.maxSo2, (max) => lte(style.so2, max)),
    when(filter.so2Added, (added) => eq(style.so2Added, added)),
    when(filter.vegan, (vegan) => eq(style.vegan, vegan)),
    when(filter.amphora, (amphora) => eq(style.amphora, amphora)),
    when(filter.magnum, (magnum) => eq(style.magnum, magnum)),
    when(filter.inStock, inStock),
    when(filter.listed, (listed) => eq(style.unlisted, !listed)),
  ]
}

const withDefaultVintage = and(eq(defaultVintage.styleId, style.id), eq(defaultVintage.isDefault, true))

const toVintage = ({ styleId: _, left, preOrder, ...vintage }: WineProductRow): WineVintage => ({
  ...vintage,
  ...(left !== null && { left }),
  ...(preOrder !== null && { preOrder }),
})

async function withVintages(db: DbOrTx, styles: WineStyleRow[]): Promise<Wine[]> {
  if (styles.length === 0) return []
  const products = await db
    .select()
    .from(t.wines)
    .where(
      inArray(
        t.wines.styleId,
        styles.map((row) => row.id),
      ),
    )
    .orderBy(asc(t.wines.vintage))
  const byStyle = Map.groupBy(products, (product) => product.styleId)
  return styles.map((row) => ({ ...toWine(row), vintages: (byStyle.get(row.id) ?? []).map(toVintage) }))
}

export async function findWines(db: DbOrTx, filter: WineFilter = {}) {
  const rows = await db
    .select({ style })
    .from(style)
    .innerJoin(defaultVintage, withDefaultVintage)
    .where(and(...conditions(filter)))
    .orderBy(...(filter.sort ? ORDER[filter.sort] : []), ...NEWEST)
  return withVintages(
    db,
    rows.map((row) => row.style),
  )
}

async function countBy(db: DbOrTx, key: typeof style.type | typeof style.region, filter: WineFilter) {
  const rows = await db
    .select({ key, count: count() })
    .from(style)
    .innerJoin(defaultVintage, withDefaultVintage)
    .where(and(...conditions(filter)))
    .groupBy(key)
  return new Map(rows.map((row) => [String(row.key), row.count]))
}

export const countWinesByType = (db: DbOrTx, filter: WineFilter) => countBy(db, style.type, filter)

export const countWinesByRegion = (db: DbOrTx, filter: WineFilter) => countBy(db, style.region, filter)

export async function findWinePriceRange(db: DbOrTx, filter: WineFilter) {
  const [row] = await db
    .select({ min: min(defaultVintage.price), max: max(defaultVintage.price) })
    .from(style)
    .innerJoin(defaultVintage, withDefaultVintage)
    .where(and(...conditions(filter)))
  return row?.min != null && row.max != null ? { min: row.min, max: row.max } : null
}

async function findWinesByStyle(db: DbOrTx, ids: string[]) {
  if (ids.length === 0) return []
  return withVintages(db, await db.select().from(style).where(inArray(style.id, ids)))
}

const findProducts = (db: DbOrTx, ids: string[]) =>
  ids.length === 0 ? Promise.resolve([]) : db.select().from(t.wines).where(inArray(t.wines.id, ids))

export async function findWine(db: DbOrTx, id: string) {
  const [product] = await findProducts(db, [id])
  const [wine] = await findWinesByStyle(db, [product?.styleId ?? id])
  return wine
}

export async function findSellableWines(db: DbOrTx, ids: string[]): Promise<SellableWine[]> {
  const products = await findProducts(db, ids)
  const styles = new Map(
    (await findWinesByStyle(db, [...new Set(products.map((product) => product.styleId))])).map((wine) => [
      wine.id,
      wine,
    ]),
  )
  return products.flatMap((product) => {
    const wine = styles.get(product.styleId)
    return wine ? [{ ...wine, id: product.id, price: product.price, vintage: toVintage(product) }] : []
  })
}
