import type { DbOrTx } from '../db/client.ts'
import { toAccount } from '../lib/mappers.ts'
import { findUserById, updateUser } from '../repositories/user.repository.ts'
import type { Account, Address } from '../types/account.ts'
import { unauthorized } from '../utils/errors.ts'

export interface AccountChanges {
  firstName?: string
  lastName?: string
  phone?: string | null
  address?: Address | null
}

export const addressColumns = (address: Address | null) => ({
  street: address?.street ?? null,
  postcode: address?.postcode ?? null,
  city: address?.city ?? null,
  country: address?.country ?? null,
  door: address?.door || null,
})

export async function requireUser(db: DbOrTx, userId: string) {
  const user = await findUserById(db, userId)
  if (!user) throw unauthorized('Your session has expired, please log in again')
  return user
}

export async function getAccount(db: DbOrTx, userId: string): Promise<Account> {
  return toAccount(await requireUser(db, userId))
}

export async function updateAccount(db: DbOrTx, userId: string, changes: AccountChanges): Promise<Account> {
  const { address, phone, ...names } = changes
  const columns = {
    ...names,
    ...(phone !== undefined && { phone: phone || null }),
    ...(address !== undefined && addressColumns(address)),
  }
  if (Object.keys(columns).length === 0) return getAccount(db, userId)
  const user = await updateUser(db, userId, columns)
  if (!user) throw unauthorized('Your session has expired, please log in again')
  return toAccount(user)
}
