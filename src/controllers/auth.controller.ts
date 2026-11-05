import type { loginSchema, logoutSchema, signupSchema } from '../dto/auth.dto.ts'
import { endSession, startSession } from '../lib/session.ts'
import * as auth from '../services/auth.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function signup(req: Request<typeof signupSchema>, reply: Reply<typeof signupSchema>) {
  const account = await auth.signup(req.server.db, req.body)
  await startSession(req, reply, account.id)
  return reply.code(201).send(account)
}

export async function login(req: Request<typeof loginSchema>, reply: Reply<typeof loginSchema>) {
  const account = await auth.login(req.server.db, req.body)
  await startSession(req, reply, account.id)
  return account
}

export async function logout(_req: Request<typeof logoutSchema>, reply: Reply<typeof logoutSchema>) {
  endSession(reply)
  return reply.code(204).send()
}
