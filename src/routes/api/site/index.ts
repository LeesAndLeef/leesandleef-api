import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import { getSiteSchema } from '../../../dto/catalog.dto.ts'

export const siteRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: getSiteSchema }, catalog.getSite)
}
