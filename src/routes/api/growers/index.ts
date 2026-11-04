import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import * as visits from '../../../controllers/visit.controller.ts'
import { getGrowerSchema, listGrowersSchema } from '../../../dto/catalog.dto.ts'
import { requestVisitSchema } from '../../../dto/visit.dto.ts'

export const growerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: listGrowersSchema }, catalog.listGrowers)
  app.get('/:id', { schema: getGrowerSchema }, catalog.getGrower)
  app.post('/:id/visits', { schema: requestVisitSchema }, visits.requestVisit)
}
