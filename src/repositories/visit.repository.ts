import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export async function insertVisitRequest(db: DbOrTx, request: typeof t.visitRequests.$inferInsert) {
  const [row] = await db
    .insert(t.visitRequests)
    .values(request)
    .returning({ id: t.visitRequests.id, date: t.visitRequests.date })
  if (!row) throw new Error('Could not save visit request')
  return row
}
