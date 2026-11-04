import { eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export async function findSite(db: DbOrTx) {
  const [row] = await db.select().from(t.siteSettings).where(eq(t.siteSettings.id, 'main'))
  if (!row) throw new Error('Site settings are missing: run yarn db:seed')
  return row.data
}
