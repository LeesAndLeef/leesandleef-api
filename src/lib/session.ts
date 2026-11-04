import type { FastifyReply, FastifyRequest } from 'fastify'
import { COOKIE_MAX_AGE, SESSION_COOKIE } from '../config/constants.ts'

export async function startSession(req: FastifyRequest, reply: FastifyReply, userId: string) {
  const token = await reply.jwtSign({ sub: userId })
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: req.server.config.secureCookies,
    maxAge: COOKIE_MAX_AGE,
  })
}

export function endSession(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

export const currentUserId = (req: FastifyRequest) => req.user.sub
