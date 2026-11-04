import { describe, expect, it } from 'vitest'
import { orderEmail } from '../src/lib/emails/orderEmail.ts'
import type { OrderView } from '../src/lib/orderView.ts'

const order: OrderView = {
  id: '00000000-0000-4000-8000-000000000000',
  number: 'LL-TEST1',
  status: 'paid',
  firstName: '<Ana>',
  email: 'ana@example.com',
  shipName: 'Standard courier',
  payName: 'Card',
  shipTo: 'Main 1, 1010 Vienna, Austria',
  giftNote: 'Happy birthday & cheers',
  promo: 'HARVEST10',
  lines: [
    {
      key: 'teran',
      id: 'teran',
      qty: 6,
      kind: 'wine',
      name: 'Teran 2023',
      meta: 'Red · Istria',
      unit: 24,
      total: 144,
      isWine: true,
      isClub: false,
    },
  ],
  totals: { subtotal: 144, mixDiscount: 14.4, promoDiscount: 12.96, shipping: 9.9, total: 126.54 },
  total: 126.54,
  createdAt: new Date(),
  paidAt: new Date(),
}
const site = { street: 'Ulica Podrumara 7', city: '52000 Pazin, Croatia', email: 'hello@example.com' }
const bank = { beneficiary: 'Lees & Leaf d.o.o.', iban: 'HR1210010051863000160' }

describe('orderEmail', () => {
  it('escapes customer input in the HTML', () => {
    const mail = orderEmail({ order, site })
    expect(mail.html).toContain('Hi &lt;Ana&gt;')
    expect(mail.html).toContain('Happy birthday &amp; cheers')
    expect(mail.text).toContain('Hi <Ana>')
  })

  it('lists discounts and the total', () => {
    const mail = orderEmail({ order, site })
    expect(mail.text).toContain('Mixed six −10%: -€14.40')
    expect(mail.text).toContain('Promo HARVEST10: -€12.96')
    expect(mail.text).toContain('Total: €126.54')
  })

  it('adds transfer details only while awaiting a transfer', () => {
    expect(orderEmail({ order, site, bank }).text).not.toContain('IBAN')
    const mail = orderEmail({ order: { ...order, status: 'awaiting_transfer' }, site, bank })
    expect(mail.subject).toBe('Order LL-TEST1: bank transfer details')
    expect(mail.text).toContain('IBAN: HR1210010051863000160')
    expect(mail.text).toContain('Reference: LL-TEST1')
  })
})
