import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as orders from '../../../controllers/order.controller.ts'
import { getOrderSchema, placeOrderSchema } from '../../../dto/order.dto.ts'

export const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/', { schema: placeOrderSchema }, orders.placeOrder)
  app.get('/:id', { schema: getOrderSchema }, orders.getOrder)
}
