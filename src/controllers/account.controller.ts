import type { getAccountSchema, updateAccountSchema } from '../dto/account.dto.ts'
import { currentUserId } from '../lib/session.ts'
import * as account from '../services/account.service.ts'
import type { Request } from '../types/http.ts'

export async function getAccount(req: Request<typeof getAccountSchema>) {
  return account.getAccount(req.server.db, currentUserId(req))
}

export async function updateAccount(req: Request<typeof updateAccountSchema>) {
  return account.updateAccount(req.server.db, currentUserId(req), req.body)
}
