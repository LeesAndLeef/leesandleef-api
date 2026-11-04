import type { FastifyPluginAsync } from 'fastify'
import { health } from '../../controllers/health.controller.ts'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { schema: { hide: true } }, health)
}
