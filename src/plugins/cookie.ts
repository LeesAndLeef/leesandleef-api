import fastifyCookie from '@fastify/cookie'
import fp from 'fastify-plugin'

export const cookie = fp(
  async (app) => {
    await app.register(fastifyCookie)
  },
  { name: 'cookie' },
)
