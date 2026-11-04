import fastifyCors from '@fastify/cors'
import fp from 'fastify-plugin'

export const cors = fp<{ origin: string[] }>(
  async (app, { origin }) => {
    await app.register(fastifyCors, { origin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
  },
  { name: 'cors' },
)
