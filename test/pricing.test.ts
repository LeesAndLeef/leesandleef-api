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
  it('prices each vintage as its own product, named with its year', () => {
    const [priced] = priceLines([line('teran-crvena-zemlja-2022', 2)], items)
    expect(priced).toMatchObject({ unit: 26, total: 52, name: 'Teran “Crvena Zemlja” 2022', isWine: true })
    expect(priced?.item).not.toHaveProperty('detail')
  })

  it('prices each oil size as its own product', () => {
    const [small, big] = priceLines([line('istarska-bjelica-250', 1), line('istarska-bjelica-3000', 2)], items)
    expect(small).toMatchObject({ unit: 16, total: 16, meta: 'Olive oil · 250 ml tin', name: 'Istarska Bjelica' })
    expect(big).toMatchObject({ unit: 120, total: 240, meta: 'Olive oil · 3 L tin' })
  })

  it('drops a plain oil id, which is not for sale without a size', () => {
    expect(priceLines([line('istarska-bjelica', 1)], items)).toEqual([])
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
    expect(totalsFor([line('teran-crvena-zemlja-2023', 2)])).toMatchObject({ subtotal: 48, shipping: 9.9, total: 57.9 })
  })

  it('takes 10% off six or more wine bottles', () => {
    const totals = totalsFor([line('teran-crvena-zemlja-2023', 6)])
    expect(totals).toMatchObject({ wineBottles: 6, mixDiscount: 14.4, goodsAfter: 129.6, shipping: 0 })
  })

  it('applies the promo after the mix discount and only to goods', () => {
    const totals = totalsFor([line('teran-crvena-zemlja-2023', 6), line('club-cellar', 1, 'season')], 0.1)
    expect(totals).toMatchObject({ mixDiscount: 14.4, promoDiscount: 12.96, goodsAfter: 116.64, shipping: 9.9 })
    expect(totals.total).toBe(116.64 + 119 + 9.9)
  })

  it('ships club-only carts free', () => {
    expect(totalsFor([line('club-explorer', 1, 'season')])).toMatchObject({ shipping: 0, total: 64 })
  })
})

describe('shippingOptions', () => {
  it('adds the Saturday surcharge, makes pickup free and prices the cart with each option', () => {
    expect(shippingOptions({ shipping: 9.9, total: 35.9 }).map((o) => [o.id, o.price, o.total])).toEqual([
      ['std', 9.9, 35.9],
      ['sat', 18.9, 44.9],
      ['pick', 0, 26],
    ])
  })
})
