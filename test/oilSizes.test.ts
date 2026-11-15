import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { createDb } from '../src/db/client.ts'
import type { Oil } from '../src/types/content.ts'

const url = process.env.DATABASE_URL

describe.skipIf(!url)('oil sizes', () => {
  const { db, pool } = createDb(url ?? '')
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp({
      db,
      corsOrigin: [],
      config: { secureCookies: false, jwtSecret: 'x'.repeat(32), cookieSecret: 'y'.repeat(32), bank: null },
    })
  })

  afterAll(async () => {
    await app.close()
    await pool.end()
  })

  it('lists every size of an oil with its own id and price', async () => {
    const oil: Oil = (await app.inject({ method: 'GET', url: '/api/v1/oils/istarska-bjelica' })).json()
    expect(oil.sizes).toEqual([
      { id: 'istarska-bjelica-250', size: '250', label: '250 ml', name: '250 ml tin', price: 16 },
      { id: 'istarska-bjelica-500', size: '500', label: '500 ml', name: '500 ml tin', price: 26 },
      { id: 'istarska-bjelica-3000', size: '3000', label: '3 L', name: '3 L tin', price: 120 },
    ])
  })

  it('opens the same oil from any of its size ids, so a size page can switch sizes', async () => {
    const oil: Oil = (await app.inject({ method: 'GET', url: '/api/v1/oils/istarska-bjelica-250' })).json()
    expect(oil.id).toBe('istarska-bjelica')
    expect(oil.sizes.map((size) => size.id)).toContain('istarska-bjelica-3000')
  })

  it('sells sizes by id and asks for a size when given the oil', async () => {
    const added = await app.inject({
      method: 'POST',
      url: '/api/v1/cart/lines',
      payload: { id: 'istarska-bjelica-3000', qty: 2 },
    })
    expect(added.statusCode).toBe(200)
    expect(added.json().lines[0]).toMatchObject({ id: 'istarska-bjelica-3000', unit: 120, total: 240 })

    const plain = await app.inject({ method: 'POST', url: '/api/v1/cart/lines', payload: { id: 'istarska-bjelica' } })
    expect(plain.statusCode).toBe(422)
    expect(plain.json().message).toContain('istarska-bjelica-250')
  })

  it('keeps prices and stock only on the products, not on the oil style', async () => {
    const oil = (await app.inject({ method: 'GET', url: '/api/v1/oils/buza-grove-14' })).json()
    expect(oil).not.toHaveProperty('price')
    expect(oil).not.toHaveProperty('left')
    expect(oil.sizes.map((size: { left?: number }) => size.left)).toEqual([undefined, 300, undefined])
  })

  it('dates each oil release and lists the newest first', async () => {
    const oils: Oil[] = (await app.inject({ method: 'GET', url: '/api/v1/oils' })).json().data
    for (const oil of oils) expect(new Date(oil.releaseDate).toISOString()).toBe(oil.releaseDate)
    const dates = oils.map((oil) => oil.releaseDate)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('sells a tasting set as its one size, under the set id', async () => {
    const set: Oil = (await app.inject({ method: 'GET', url: '/api/v1/oils/oil-tasting-set' })).json()
    expect(set.sizes).toEqual([
      { id: 'oil-tasting-set', size: null, label: '3 × 250 ml tins', name: 'Tasting set', price: 36 },
    ])
    const added = await app.inject({ method: 'POST', url: '/api/v1/cart/lines', payload: { id: 'oil-tasting-set' } })
    expect(added.json().lines[0]).toMatchObject({ id: 'oil-tasting-set', unit: 36 })
  })
})
