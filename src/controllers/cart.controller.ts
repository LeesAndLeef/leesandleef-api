import type {
  addLineSchema,
  applyPromoSchema,
  clearCartSchema,
  getCartSchema,
  getShippingOptionsSchema,
  moveToCartSchema,
  removeLineSchema,
  removePromoSchema,
  removeSavedSchema,
  saveForLaterSchema,
  setGiftNoteSchema,
  setQtySchema,
} from '../dto/cart.dto.ts'
import { readCart, sendCart } from '../lib/cartSession.ts'
import { shippingOptions } from '../lib/pricing.ts'
import * as cart from '../services/cart.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function getCart(req: Request<typeof getCartSchema>, reply: Reply<typeof getCartSchema>) {
  return sendCart(req, reply, await cart.getCart(req.server.db, readCart(req)))
}

export async function getShippingOptions(
  req: Request<typeof getShippingOptionsSchema>,
  reply: Reply<typeof getShippingOptionsSchema>,
) {
  const { totals } = sendCart(req, reply, await cart.getCart(req.server.db, readCart(req)))
  return shippingOptions(totals)
}

export async function addLine(req: Request<typeof addLineSchema>, reply: Reply<typeof addLineSchema>) {
  return sendCart(req, reply, await cart.addItem(req.server.db, readCart(req), req.body))
}

export async function setQty(req: Request<typeof setQtySchema>, reply: Reply<typeof setQtySchema>) {
  return sendCart(req, reply, await cart.setQty(req.server.db, readCart(req), req.params.key, req.body.qty))
}

export async function removeLine(req: Request<typeof removeLineSchema>, reply: Reply<typeof removeLineSchema>) {
  return sendCart(req, reply, await cart.removeLine(req.server.db, readCart(req), req.params.key))
}

export async function saveForLater(req: Request<typeof saveForLaterSchema>, reply: Reply<typeof saveForLaterSchema>) {
  return sendCart(req, reply, await cart.saveForLater(req.server.db, readCart(req), req.params.key))
}

export async function moveToCart(req: Request<typeof moveToCartSchema>, reply: Reply<typeof moveToCartSchema>) {
  return sendCart(req, reply, await cart.moveToCart(req.server.db, readCart(req), req.params.key))
}

export async function removeSaved(req: Request<typeof removeSavedSchema>, reply: Reply<typeof removeSavedSchema>) {
  return sendCart(req, reply, await cart.removeSaved(req.server.db, readCart(req), req.params.key))
}

export async function applyPromo(req: Request<typeof applyPromoSchema>, reply: Reply<typeof applyPromoSchema>) {
  return sendCart(req, reply, await cart.applyPromo(req.server.db, readCart(req), req.body.code))
}

export async function removePromo(req: Request<typeof removePromoSchema>, reply: Reply<typeof removePromoSchema>) {
  return sendCart(req, reply, await cart.removePromo(req.server.db, readCart(req)))
}

export async function setGiftNote(req: Request<typeof setGiftNoteSchema>, reply: Reply<typeof setGiftNoteSchema>) {
  return sendCart(req, reply, await cart.setGiftNote(req.server.db, readCart(req), req.body.note))
}

export async function clearCart(req: Request<typeof clearCartSchema>, reply: Reply<typeof clearCartSchema>) {
  return sendCart(req, reply, await cart.clearCart(req.server.db, readCart(req)))
}
