import type { FastifyPluginAsync } from 'fastify'
import { stripeWebhook } from '../../../controllers/webhook.controller.ts'

export const stripeWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))
  app.post('/', { schema: { hide: true } }, stripeWebhook)
}
