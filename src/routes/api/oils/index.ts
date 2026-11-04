import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import { getOilSchema, listOilsSchema } from '../../../dto/catalog.dto.ts'

export const oilRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: listOilsSchema }, catalog.listOils)
  app.get('/:id', { schema: getOilSchema }, catalog.getOil)
}
