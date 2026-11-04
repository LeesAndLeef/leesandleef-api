import fastifyJwt from '@fastify/jwt'
import type { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { COOKIE_MAX_AGE, SESSION_COOKIE } from '../config/constants.ts'
import { unauthorized } from '../utils/errors.ts'

export const auth = fp(
  async (app) => {
    await app.register(fastifyJwt, {
      secret: app.config.jwtSecret,
      cookie: { cookieName: SESSION_COOKIE, signed: false },
      sign: { expiresIn: COOKIE_MAX_AGE },
    })
    app.decorate('authenticate', async (req: FastifyRequest) => {
      try {
        await req.jwtVerify()
      } catch {
        throw unauthorized('Log in to continue')
      }
    })
  },
  { name: 'auth', dependencies: ['dependencies', 'cookie'] },
)
