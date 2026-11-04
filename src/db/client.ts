import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.ts'

export function createDb(url: string) {
  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool, { schema, casing: 'snake_case' })
  return { db, pool }
}

export type Db = ReturnType<typeof createDb>['db']
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx
