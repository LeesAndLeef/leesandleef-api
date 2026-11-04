import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import { listClubPlansSchema } from '../../../dto/catalog.dto.ts'

export const clubPlanRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: listClubPlansSchema }, catalog.listClubPlans)
}
