import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import { getWineSchema, listWinesSchema } from '../../../dto/catalog.dto.ts'

export const wineRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: listWinesSchema }, catalog.listWines)
  app.get('/:id', { schema: getWineSchema }, catalog.getWine)
}
