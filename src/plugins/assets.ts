import { join } from 'node:path'
import fastifyStatic from '@fastify/static'
import fp from 'fastify-plugin'

export const assets = fp(
  async (app) => {
    await app.register(fastifyStatic, {
      root: join(import.meta.dirname, '..', '..', 'public', 'assets'),
      prefix: '/assets/',
      maxAge: '7d',
    })
  },
  { name: 'assets' },
)
