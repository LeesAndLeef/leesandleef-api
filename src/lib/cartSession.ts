import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { CART_COOKIE, COOKIE_MAX_AGE, MAX_COOKIE_LENGTH } from '../config/constants.ts'
import type { CartLine, CartState, PricedCart } from '../types/cart.ts'
import { unprocessable } from '../utils/errors.ts'
import { lineKey } from './cartOptions.ts'

export const EMPTY_CART: CartState = { lines: [], saved: [], promo: null, giftNote: null, pendingOrderId: null }

const storedLine = z.tuple([z.string(), z.string().nullable(), z.number().int().positive()])

const storedCart = z.object({
  l: z.array(storedLine),
  s: z.array(storedLine),
  p: z.string().nullable(),
  g: z.string().nullable(),
  o: z.uuid().nullable(),
})

type StoredLine = z.infer<typeof storedLine>

const toLine = ([id, option, qty]: StoredLine): CartLine => ({
  key: lineKey(id, option ?? undefined),
  id,
  ...(option !== null && { option }),
  qty,
})

const fromLine = (line: CartLine): StoredLine => [line.id, line.option ?? null, line.qty]

function decode(value: string): CartState {
  try {
    const parsed = storedCart.safeParse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')))
    if (!parsed.success) return EMPTY_CART
    const { l, s, p, g, o } = parsed.data
    return { lines: l.map(toLine), saved: s.map(toLine), promo: p, giftNote: g, pendingOrderId: o }
  } catch {
    return EMPTY_CART
  }
}

function encode(cart: CartState) {
  const stored = {
    l: cart.lines.map(fromLine),
    s: cart.saved.map(fromLine),
    p: cart.promo,
    g: cart.giftNote,
    o: cart.pendingOrderId,
  }
  return Buffer.from(JSON.stringify(stored)).toString('base64url')
}

const isEmpty = (cart: CartState) =>
  cart.lines.length === 0 && cart.saved.length === 0 && !cart.promo && !cart.giftNote && !cart.pendingOrderId

export function readCart(req: FastifyRequest): CartState {
  const raw = req.cookies[CART_COOKIE]
  if (!raw) return EMPTY_CART
  const unsigned = req.unsignCookie(raw)
  return unsigned.valid && unsigned.value ? decode(unsigned.value) : EMPTY_CART
}

export function writeCart(req: FastifyRequest, reply: FastifyReply, cart: CartState) {
  if (isEmpty(cart)) {
    if (req.cookies[CART_COOKIE]) reply.clearCookie(CART_COOKIE, { path: '/' })
    return
  }
  const value = encode(cart)
  if (value.length > MAX_COOKIE_LENGTH) throw unprocessable('Your cart is full: remove something first')
  reply.setCookie(CART_COOKIE, value, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: req.server.config.secureCookies,
    maxAge: COOKIE_MAX_AGE,
    signed: true,
  })
}

export function sendCart(req: FastifyRequest, reply: FastifyReply, result: { state: CartState; cart: PricedCart }) {
  writeCart(req, reply, result.state)
  return result.cart
}
