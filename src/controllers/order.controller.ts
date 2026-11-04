import type { getOrderSchema, placeOrderSchema } from '../dto/order.dto.ts'
import { currentCartId, requireCartId } from '../lib/cartSession.ts'
import { getOrderForCart, placeOrder as place } from '../services/order.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function placeOrder(req: Request<typeof placeOrderSchema>, reply: Reply<typeof placeOrderSchema>) {
  const placed = await place(req.server, await requireCartId(req), req.body)
  return reply.code(201).send(placed)
}

export async function getOrder(req: Request<typeof getOrderSchema>) {
  return getOrderForCart(req.server, await currentCartId(req), req.params.id)
}
