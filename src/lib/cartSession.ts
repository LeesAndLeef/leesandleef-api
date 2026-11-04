import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from '../config/constants.ts'
import { createCart, findCart } from '../repositories/cart.repository.ts'
import { notFound } from '../utils/errors.ts'

const cartIdSchema = z.uuid()

export async function currentCartId(req: FastifyRequest): Promise<string | null> {
  const parsed = cartIdSchema.safeParse(req.cookies[CART_COOKIE])
  if (!parsed.success) return null
  const cart = await findCart(req.server.db, parsed.data)
  return cart?.id ?? null
}

export async function ensureCartId(req: FastifyRequest, reply: FastifyReply): Promise<string> {
  const existing = await currentCartId(req)
  if (existing) return existing
  const cart = await createCart(req.server.db)
  reply.setCookie(CART_COOKIE, cart.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: req.server.config.secureCookies,
    maxAge: CART_COOKIE_MAX_AGE,
  })
  return cart.id
}

export async function requireCartId(req: FastifyRequest): Promise<string> {
  const cartId = await currentCartId(req)
  if (!cartId) throw notFound('No cart yet: add an item first')
  return cartId
}
