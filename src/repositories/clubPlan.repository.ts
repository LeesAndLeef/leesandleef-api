import { asc } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toClubPlan } from '../lib/mappers.ts'

export async function findClubPlans(db: DbOrTx) {
  const rows = await db.select().from(t.clubPlans).orderBy(asc(t.clubPlans.position))
  return rows.map(toClubPlan)
}
