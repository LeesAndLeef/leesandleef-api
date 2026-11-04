import type { getOrderSchema, listOrdersSchema, placeOrderSchema } from '../dto/order.dto.ts'
import { readCart, writeCart } from '../lib/cartSession.ts'
import { currentUserId } from '../lib/session.ts'
import { getOrderForUser, listOrders as list, placeOrder as place } from '../services/order.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function placeOrder(req: Request<typeof placeOrderSchema>, reply: Reply<typeof placeOrderSchema>) {
  const { cart, ...placed } = await place(req.server, currentUserId(req), readCart(req), req.body)
  writeCart(req, reply, cart)
  return reply.code(201).send(placed)
}

export async function listOrders(req: Request<typeof listOrdersSchema>) {
  return list(req.server.db, currentUserId(req))
}

export async function getOrder(req: Request<typeof getOrderSchema>) {
  return getOrderForUser(req.server, currentUserId(req), req.params.id)
}
