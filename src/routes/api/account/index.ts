import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as account from '../../../controllers/account.controller.ts'
import { getAccountSchema, updateAccountSchema } from '../../../dto/account.dto.ts'

export const accountRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.get('/', { schema: getAccountSchema }, account.getAccount)
  app.patch('/', { schema: updateAccountSchema }, account.updateAccount)
}
