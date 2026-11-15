import {
  DEFAULT_WINE_VOLUME,
  FREE_SHIPPING_FROM,
  FREQ_LABEL,
  MIX_DISCOUNT_RATE,
  MIX_SIX,
  SATURDAY_SURCHARGE,
  SHIP_DETAILS,
  SHIP_METHODS,
  SHIPPING_FEE,
} from '../config/constants.ts'
import type { CartItemSummary, CartLine, PricedLine, ShipMethod, ShipOption, Totals } from '../types/cart.ts'
import type { CartItem, Freq, SellableOil } from '../types/content.ts'
import { roundMoney } from '../utils/money.ts'
import { maxQty } from './cartOptions.ts'

const oilMeta = (oil: SellableOil) => (oil.set ? `Tasting set · ${oil.set.contents}` : `Olive oil · ${oil.size.name}`)

export function summarize(item: CartItem): CartItemSummary {
  if (item.kind === 'club') return item
  const { detail: _, ...summary } = item
  return summary
}

export function priceLine(line: CartLine, item: CartItem | undefined): PricedLine | null {
  if (!item) return null
  const base = { ...line, kind: item.kind, item: summarize(item), maxQty: maxQty(item) }

  if (item.kind === 'club') {
    const freq = (line.option ?? 'season') as Freq
    const unit = item.price[freq]
    return {
      ...base,
      name: `The Club — ${item.name}`,
      meta: `${item.bottles} bottles · ${FREQ_LABEL[freq]}`,
      unit,
      total: roundMoney(unit * line.qty),
      isWine: false,
      isClub: true,
      glass: 'var(--wine)',
    }
  }

  const unit = item.price
  const name = item.kind === 'wine' ? item.vintage.name : item.name
  const meta =
    item.kind === 'wine' ? `${item.type} · ${item.region} · ${item.volume ?? DEFAULT_WINE_VOLUME}` : oilMeta(item)
  return {
    ...base,
    name,
    meta,
    unit,
    total: roundMoney(unit * line.qty),
    isWine: item.kind === 'wine',
    isClub: false,
    glass: item.glass,
  }
}

export function priceLines(lines: CartLine[], items: Map<string, CartItem>): PricedLine[] {
  return lines.map((line) => priceLine(line, items.get(line.id))).filter((l): l is PricedLine => l !== null)
}

const sum = (lines: PricedLine[]) => lines.reduce((a, l) => a + l.total, 0)

export function computeTotals(lines: PricedLine[], promoRate: number): Totals {
  const wines = lines.filter((l) => l.isWine)
  const goods = lines.filter((l) => !l.isClub)
  const club = lines.filter((l) => l.isClub)

  const count = lines.reduce((a, l) => a + l.qty, 0)
  const wineBottles = wines.reduce((a, l) => a + l.qty, 0)
  const goodsSum = roundMoney(sum(goods))
  const clubSum = roundMoney(sum(club))
  const subtotal = roundMoney(goodsSum + clubSum)

  const mixDiscount = wineBottles >= MIX_SIX ? roundMoney(sum(wines) * MIX_DISCOUNT_RATE) : 0
  const promoDiscount = roundMoney((goodsSum - mixDiscount) * promoRate)
  const goodsAfter = roundMoney(goodsSum - mixDiscount - promoDiscount)

  const shipping = goodsSum === 0 || goodsAfter >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

  return {
    count,
    wineBottles,
    subtotal,
    mixDiscount,
    promoDiscount,
    goodsAfter,
    shipping,
    total: roundMoney(goodsAfter + clubSum + shipping),
  }
}

const shipPrice: Record<ShipMethod, (shipping: number) => number> = {
  std: (shipping) => shipping,
  sat: (shipping) => roundMoney(shipping + SATURDAY_SURCHARGE),
  pick: () => 0,
}

export function shippingOptions(totals: Pick<Totals, 'shipping'>): ShipOption[] {
  return SHIP_METHODS.map((id) => ({ id, ...SHIP_DETAILS[id], price: shipPrice[id](totals.shipping) }))
}
