import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as searchController from '../../../controllers/search.controller.ts'
import { searchSchema } from '../../../dto/search.dto.ts'

export const searchRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: searchSchema }, searchController.search)
}
