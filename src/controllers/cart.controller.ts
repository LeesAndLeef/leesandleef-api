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
import { currentCartId, ensureCartId, requireCartId } from '../lib/cartSession.ts'
import { shippingOptions } from '../lib/pricing.ts'
import * as cart from '../services/cart.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function getCart(req: Request<typeof getCartSchema>) {
  return cart.loadPricedCart(req.server.db, await currentCartId(req))
}

export async function getShippingOptions(req: Request<typeof getShippingOptionsSchema>) {
  const { totals } = await cart.loadPricedCart(req.server.db, await currentCartId(req))
  return shippingOptions(totals)
}

export async function addLine(req: Request<typeof addLineSchema>, reply: Reply<typeof addLineSchema>) {
  return cart.addItem(req.server.db, await ensureCartId(req, reply), req.body)
}

export async function setQty(req: Request<typeof setQtySchema>) {
  return cart.setQty(req.server.db, await requireCartId(req), req.params.key, req.body.qty)
}

export async function removeLine(req: Request<typeof removeLineSchema>) {
  return cart.removeLine(req.server.db, await requireCartId(req), req.params.key)
}

export async function saveForLater(req: Request<typeof saveForLaterSchema>) {
  return cart.saveForLater(req.server.db, await requireCartId(req), req.params.key)
}

export async function moveToCart(req: Request<typeof moveToCartSchema>) {
  return cart.moveToCart(req.server.db, await requireCartId(req), req.params.key)
}

export async function removeSaved(req: Request<typeof removeSavedSchema>) {
  return cart.removeSaved(req.server.db, await requireCartId(req), req.params.key)
}

export async function applyPromo(req: Request<typeof applyPromoSchema>, reply: Reply<typeof applyPromoSchema>) {
  return cart.applyPromo(req.server.db, await ensureCartId(req, reply), req.body.code)
}

export async function removePromo(req: Request<typeof removePromoSchema>) {
  return cart.removePromo(req.server.db, await requireCartId(req))
}

export async function setGiftNote(req: Request<typeof setGiftNoteSchema>, reply: Reply<typeof setGiftNoteSchema>) {
  return cart.setGiftNote(req.server.db, await ensureCartId(req, reply), req.body.note)
}

export async function clearCart(req: Request<typeof clearCartSchema>) {
  const cartId = await requireCartId(req)
  await cart.clearCart(req.server.db, cartId)
  return cart.loadPricedCart(req.server.db, cartId)
}
