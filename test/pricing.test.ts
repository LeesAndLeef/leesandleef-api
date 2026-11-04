import { describe, expect, it } from 'vitest'
import { computeTotals, priceLines, shippingOptions } from '../src/lib/pricing.ts'
import type { CartLine } from '../src/types/cart.ts'
import { items } from './fixtures.ts'

const line = (id: string, qty: number, option?: string): CartLine => ({
  key: option ? `${id}@${option}` : id,
  id,
  qty,
  ...(option && { option }),
})

const totalsFor = (lines: CartLine[], promoRate = 0) => computeTotals(priceLines(lines, items), promoRate)

describe('priceLines', () => {
  it('prices a vintage at its own price and renames it', () => {
    const [priced] = priceLines([line('teran-crvena-zemlja', 2, '2022')], items)
    expect(priced).toMatchObject({ unit: 26, total: 52, name: 'Teran “Crvena Zemlja” 2022', isWine: true })
    expect(priced?.item).not.toHaveProperty('detail')
  })

  it('scales oil prices by tin size', () => {
    const [small, big] = priceLines([line('istarska-bjelica', 1, '250'), line('istarska-bjelica', 1, '3000')], items)
    expect(small?.unit).toBe(16)
    expect(big?.unit).toBe(120)
  })

  it('prices club plans by frequency and caps them at one', () => {
    const [plan] = priceLines([line('club-cellar', 1, 'month')], items)
    expect(plan).toMatchObject({ unit: 109, isClub: true, maxQty: 1, name: 'The Club — Cellar' })
  })

  it('drops lines whose product no longer exists', () => {
    expect(priceLines([line('gone', 1)], items)).toEqual([])
  })
})

describe('computeTotals', () => {
  it('charges shipping below €120 of goods', () => {
    expect(totalsFor([line('teran-crvena-zemlja', 2)])).toMatchObject({ subtotal: 48, shipping: 9.9, total: 57.9 })
  })

  it('takes 10% off six or more wine bottles', () => {
    const totals = totalsFor([line('teran-crvena-zemlja', 6)])
    expect(totals).toMatchObject({ wineBottles: 6, mixDiscount: 14.4, goodsAfter: 129.6, shipping: 0 })
  })

  it('applies the promo after the mix discount and only to goods', () => {
    const totals = totalsFor([line('teran-crvena-zemlja', 6), line('club-cellar', 1, 'season')], 0.1)
    expect(totals).toMatchObject({ mixDiscount: 14.4, promoDiscount: 12.96, goodsAfter: 116.64, shipping: 9.9 })
    expect(totals.total).toBe(116.64 + 119 + 9.9)
  })

  it('ships club-only carts free', () => {
    expect(totalsFor([line('club-explorer', 1, 'season')])).toMatchObject({ shipping: 0, total: 64 })
  })
})

describe('shippingOptions', () => {
  it('adds the Saturday surcharge and makes pickup free', () => {
    expect(shippingOptions({ shipping: 9.9 }).map((o) => [o.id, o.price])).toEqual([
      ['std', 9.9],
      ['sat', 18.9],
      ['pick', 0],
    ])
  })
})
