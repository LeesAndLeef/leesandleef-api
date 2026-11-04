import type { DbOrTx } from '../db/client.ts'
import { toAccount } from '../lib/mappers.ts'
import { hashPassword, verifyPassword } from '../lib/password.ts'
import { findUserByEmail, insertUser } from '../repositories/user.repository.ts'
import type { Account } from '../types/account.ts'
import { conflict, unauthorized } from '../utils/errors.ts'

export interface SignupInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

let dummyHash: Promise<string> | undefined

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function signup(db: DbOrTx, input: SignupInput): Promise<Account> {
  const user = await insertUser(db, {
    email: normalizeEmail(input.email),
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone || null,
  })
  if (!user) throw conflict('An account with this email already exists')
  return toAccount(user)
}

export async function login(db: DbOrTx, input: { email: string; password: string }): Promise<Account> {
  const user = await findUserByEmail(db, normalizeEmail(input.email))
  dummyHash ??= hashPassword('not-a-real-password')
  const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash))
  if (!user || !valid) throw unauthorized('Email or password is incorrect')
  return toAccount(user)
}
