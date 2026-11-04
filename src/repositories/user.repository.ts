import { eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'

export type UserRow = typeof t.users.$inferSelect
export type NewUser = typeof t.users.$inferInsert
export type UserChanges = Partial<Omit<NewUser, 'id' | 'email' | 'passwordHash' | 'createdAt'>>

export async function findUserById(db: DbOrTx, id: string) {
  const [row] = await db.select().from(t.users).where(eq(t.users.id, id))
  return row
}

export async function findUserByEmail(db: DbOrTx, email: string) {
  const [row] = await db.select().from(t.users).where(eq(t.users.email, email))
  return row
}

export async function insertUser(db: DbOrTx, user: NewUser) {
  const [row] = await db.insert(t.users).values(user).onConflictDoNothing({ target: t.users.email }).returning()
  return row
}

export async function updateUser(db: DbOrTx, id: string, changes: UserChanges) {
  const [row] = await db.update(t.users).set(changes).where(eq(t.users.id, id)).returning()
  return row
}
