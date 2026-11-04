import { and, asc, eq, type SQL } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toWine } from '../lib/mappers.ts'
import type { WineType } from '../types/content.ts'

export interface WineFilter {
  type?: WineType
  growerId?: string
}

export async function findWines(db: DbOrTx, filter: WineFilter = {}) {
  const where: SQL[] = []
  if (filter.type) where.push(eq(t.wines.type, filter.type))
  if (filter.growerId) where.push(eq(t.wines.growerId, filter.growerId))
  const rows = await db
    .select()
    .from(t.wines)
    .where(and(...where))
    .orderBy(asc(t.wines.position))
  return rows.map(toWine)
}

export async function findWine(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.wines).where(eq(t.wines.id, id))
  return row && toWine(row)
}
