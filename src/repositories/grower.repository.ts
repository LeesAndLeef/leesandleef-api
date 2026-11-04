import { asc, eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toGrower } from '../lib/mappers.ts'

export async function findGrowers(db: DbOrTx) {
  const rows = await db.select().from(t.growers).orderBy(asc(t.growers.position))
  return rows.map(toGrower)
}

export async function findGrower(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.growers).where(eq(t.growers.id, id))
  return row && toGrower(row)
}
