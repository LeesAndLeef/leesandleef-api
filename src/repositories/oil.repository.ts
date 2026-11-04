import { asc, eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toOil } from '../lib/mappers.ts'

export interface OilFilter {
  growerId?: string
}

export async function findOils(db: DbOrTx, filter: OilFilter = {}) {
  const rows = await db
    .select()
    .from(t.oils)
    .where(filter.growerId ? eq(t.oils.growerId, filter.growerId) : undefined)
    .orderBy(asc(t.oils.position))
  return rows.map(toOil)
}

export async function findOil(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.oils).where(eq(t.oils.id, id))
  return row && toOil(row)
}
