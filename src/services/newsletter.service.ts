import type { DbOrTx } from '../db/client.ts'
import { insertSubscriber } from '../repositories/newsletter.repository.ts'

export const subscribe = (db: DbOrTx, email: string, source: string) => insertSubscriber(db, email, source)
