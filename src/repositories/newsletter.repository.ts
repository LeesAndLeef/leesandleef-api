import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export async function insertSubscriber(db: DbOrTx, email: string, source: string) {
  await db.insert(t.newsletterSubscribers).values({ email: email.toLowerCase(), source }).onConflictDoNothing()
}
