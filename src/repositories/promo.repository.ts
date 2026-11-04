import { and, eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export async function findActivePromo(db: DbOrTx, code: string) {
  const [promo] = await db
    .select()
    .from(t.promoCodes)
    .where(and(eq(t.promoCodes.code, code), eq(t.promoCodes.active, true)))
  return promo
}
