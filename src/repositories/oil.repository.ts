import { and, asc, count, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toOil } from '../lib/mappers.ts'
import type { Oil, OilLevel, OilSize, SellableOil } from '../types/content.ts'
import { when } from '../utils/when.ts'

export interface OilFilter {
  growerId?: string
  level?: OilLevel
  set?: boolean
}

type OilStyleRow = typeof t.oilStyles.$inferSelect
type OilProductRow = typeof t.oils.$inferSelect

function conditions(filter: OilFilter) {
  return [
    when(filter.growerId, (id) => eq(t.oilStyles.growerId, id)),
    when(filter.level, (level) => eq(t.oilStyles.level, level)),
    when(filter.set, (set) => (set ? isNotNull(t.oilStyles.set) : isNull(t.oilStyles.set))),
  ]
}

const toSize = ({ styleId: _, left, ...size }: OilProductRow): OilSize => ({ ...size, ...(left !== null && { left }) })

async function withSizes(db: DbOrTx, styles: OilStyleRow[]): Promise<Oil[]> {
  if (styles.length === 0) return []
  const products = await db
    .select()
    .from(t.oils)
    .where(
      inArray(
        t.oils.styleId,
        styles.map((style) => style.id),
      ),
    )
    .orderBy(asc(t.oils.size))
  const byStyle = Map.groupBy(products, (product) => product.styleId)
  return styles.map((style) => ({ ...toOil(style), sizes: (byStyle.get(style.id) ?? []).map(toSize) }))
}

export async function findOils(db: DbOrTx, filter: OilFilter = {}) {
  const styles = await db
    .select()
    .from(t.oilStyles)
    .where(and(...conditions(filter)))
    .orderBy(desc(t.oilStyles.releaseDate), asc(t.oilStyles.id))
  return withSizes(db, styles)
}

async function findOilsByStyle(db: DbOrTx, ids: string[]) {
  if (ids.length === 0) return []
  return withSizes(db, await db.select().from(t.oilStyles).where(inArray(t.oilStyles.id, ids)))
}

export async function countOilsByLevel(db: DbOrTx, filter: OilFilter) {
  const rows = await db
    .select({ key: t.oilStyles.level, count: count() })
    .from(t.oilStyles)
    .where(and(...conditions(filter)))
    .groupBy(t.oilStyles.level)
  return new Map(rows.map((row) => [row.key, row.count]))
}

const findProducts = (db: DbOrTx, ids: string[]) =>
  ids.length === 0 ? Promise.resolve([]) : db.select().from(t.oils).where(inArray(t.oils.id, ids))

export async function findOil(db: DbOrTx, id: string) {
  const [product] = await findProducts(db, [id])
  const [oil] = await findOilsByStyle(db, [product?.styleId ?? id])
  return oil
}

export async function findSellableOils(db: DbOrTx, ids: string[]): Promise<SellableOil[]> {
  const products = await findProducts(db, ids)
  const styles = new Map(
    (await findOilsByStyle(db, [...new Set(products.map((product) => product.styleId))])).map((oil) => [oil.id, oil]),
  )
  return products.flatMap((product) => {
    const oil = styles.get(product.styleId)
    return oil ? [{ ...oil, id: product.id, price: product.price, size: toSize(product) }] : []
  })
}
