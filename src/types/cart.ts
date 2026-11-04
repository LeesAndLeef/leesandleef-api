import type { SHIP_METHODS } from '../config/constants.ts'
import type { CartItem, ClubPlan, Oil, Wine } from './content.ts'

export interface CartLine {
  key: string
  id: string
  option?: string
  qty: number
}

export type CartItemSummary = Omit<Wine, 'detail'> | Omit<Oil, 'detail'> | ClubPlan

export interface PricedLine extends CartLine {
  kind: CartItem['kind']
  item: CartItemSummary
  name: string
  meta: string
  unit: number
  total: number
  isWine: boolean
  isClub: boolean
  maxQty: number
  glass: string
}

export interface Totals {
  count: number
  wineBottles: number
  subtotal: number
  mixDiscount: number
  promoDiscount: number
  goodsAfter: number
  shipping: number
  total: number
}

export interface PricedCart {
  id: string | null
  lines: PricedLine[]
  saved: PricedLine[]
  promo: string | null
  giftNote: string | null
  totals: Totals
}

export type ShipMethod = (typeof SHIP_METHODS)[number]

export interface ShipOption {
  id: ShipMethod
  name: string
  desc: string
  price: number
}
