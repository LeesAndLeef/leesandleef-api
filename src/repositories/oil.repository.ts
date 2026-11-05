import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toOil } from '../lib/mappers.ts'
import type { OilLevel } from '../types/content.ts'
import { when } from '../utils/when.ts'

export interface OilFilter {
  growerId?: string
  level?: OilLevel
  set?: boolean
}

function conditions(filter: OilFilter) {
  return [
    when(filter.growerId, (id) => eq(t.oils.growerId, id)),
    when(filter.level, (level) => eq(t.oils.level, level)),
    when(filter.set, (set) => (set ? isNotNull(t.oils.set) : isNull(t.oils.set))),
  ]
}

export async function findOils(db: DbOrTx, filter: OilFilter = {}) {
  const rows = await db
    .select()
    .from(t.oils)
    .where(and(...conditions(filter)))
    .orderBy(asc(t.oils.position))
  return rows.map(toOil)
}

export async function findOil(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.oils).where(eq(t.oils.id, id))
  return row && toOil(row)
}
