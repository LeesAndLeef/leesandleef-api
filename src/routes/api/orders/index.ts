import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as orders from '../../../controllers/order.controller.ts'
import { getOrderSchema, listOrdersSchema, placeOrderSchema } from '../../../dto/order.dto.ts'

export const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)
  app.post('/', { schema: placeOrderSchema }, orders.placeOrder)
  app.get('/', { schema: listOrdersSchema }, orders.listOrders)
  app.get('/:id', { schema: getOrderSchema }, orders.getOrder)
}
