import type { WineFilterType } from '../types/content.ts'

export const WINE_TYPES = ['Red', 'White', 'Orange', 'Rosé', 'Sparkling', 'Dessert'] as const
export const WINE_FILTER_TYPES: WineFilterType[] = ['Red', 'White', 'Orange', 'Rosé', 'Sparkling']
export const OIL_LEVELS = ['Delicate', 'Medium', 'Robust'] as const
export const WINE_SORTS = ['newest', 'price-asc', 'price-desc', 'left'] as const
export const FREQS = ['season', 'month'] as const

export const DEFAULT_WINE_VOLUME = '750 ml'

export const OIL_SIZES = [
  { id: '250', label: '250 ml', name: '250 ml tin', mult: 0.6 },
  { id: '500', label: '500 ml', name: '500 ml tin', mult: 1 },
  { id: '3000', label: '3 L', name: '3 L tin', mult: 4.6 },
] as const
export const DEFAULT_OIL_SIZE = '500'

export const FREQ_LABEL = { season: 'per season', month: 'per month' } as const

export const MIX_SIX = 6
export const MIX_DISCOUNT_RATE = 0.1
export const FREE_SHIPPING_FROM = 120
export const SHIPPING_FEE = 9.9
export const SATURDAY_SURCHARGE = 9

export const MAX_LINE_QTY = 24
export const MAX_CLUB_QTY = 1
export const MAX_CART_LINES = 20

export const SHIP_METHODS = ['std', 'sat', 'pick'] as const
export const PAY_METHODS = ['card', 'wallet', 'bank'] as const
export const ORDER_STATUSES = ['pending_payment', 'awaiting_transfer', 'paid', 'shipped', 'cancelled'] as const

export const SHIP_DETAILS = {
  std: { name: 'Standard courier', desc: 'Packed Friday · 2–5 working days · adult signature' },
  sat: { name: 'Saturday delivery', desc: 'Major cities only · 08:00–14:00 window' },
  pick: { name: 'Collect at the cellar', desc: 'Thu–Sat, 12:00–20:00 · we’ll pour you a glass' },
} as const

export const PAY_NAMES = { card: 'Card', wallet: 'Apple / Google Pay', bank: 'Bank transfer' } as const

export const CART_COOKIE = 'cart'
export const SESSION_COOKIE = 'session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const MAX_COOKIE_LENGTH = 3800

export const PASSWORD_MIN_LENGTH = 8

export const ORDER_NUMBER_PREFIX = 'LL-'

export const CURRENCY = 'EUR'
export const LOCALE = 'en-IE'

export const SEED_PROMO_CODES = [{ code: 'HARVEST10', rate: 0.1 }]

export const QUIZ_MAX_PER_STYLE = 2
export const QUIZ_MIX_SIZE = 6
