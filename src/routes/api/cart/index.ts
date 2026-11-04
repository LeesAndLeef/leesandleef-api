import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as cart from '../../../controllers/cart.controller.ts'
import {
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
} from '../../../dto/cart.dto.ts'

export const cartRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: getCartSchema }, cart.getCart)
  app.delete('/', { schema: clearCartSchema }, cart.clearCart)
  app.get('/shipping-options', { schema: getShippingOptionsSchema }, cart.getShippingOptions)
  app.post('/lines', { schema: addLineSchema }, cart.addLine)
  app.patch('/lines/:key', { schema: setQtySchema }, cart.setQty)
  app.delete('/lines/:key', { schema: removeLineSchema }, cart.removeLine)
  app.post('/lines/:key/save-for-later', { schema: saveForLaterSchema }, cart.saveForLater)
  app.post('/saved/:key/move-to-cart', { schema: moveToCartSchema }, cart.moveToCart)
  app.delete('/saved/:key', { schema: removeSavedSchema }, cart.removeSaved)
  app.put('/promo', { schema: applyPromoSchema }, cart.applyPromo)
  app.delete('/promo', { schema: removePromoSchema }, cart.removePromo)
  app.put('/gift-note', { schema: setGiftNoteSchema }, cart.setGiftNote)
}
