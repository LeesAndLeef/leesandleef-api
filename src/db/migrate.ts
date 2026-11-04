import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { env } from '../config/env.ts'
import { createDb } from './client.ts'

const { db, pool } = createDb(env.DATABASE_URL)
await migrate(db, { migrationsFolder: 'drizzle' })
await pool.end()
console.log('Migrations applied')
