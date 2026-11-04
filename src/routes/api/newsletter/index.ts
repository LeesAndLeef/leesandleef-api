import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as newsletter from '../../../controllers/newsletter.controller.ts'
import { subscribeSchema } from '../../../dto/newsletter.dto.ts'

export const newsletterRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/', { schema: subscribeSchema }, newsletter.subscribe)
}
