import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { createDb } from '../src/db/client.ts'
import type { Oil, Wine } from '../src/types/content.ts'
import { oils as oilFixtures, wines as wineFixtures } from './fixtures.ts'

const url = process.env.DATABASE_URL
const wines = wineFixtures as Wine[]
const oils = oilFixtures as Oil[]

const ids = (list: { id: string }[]) => list.map((item) => item.id).sort()

describe.skipIf(!url)('catalog filters', () => {
  const { db, pool } = createDb(url ?? '')
  let app: Awaited<ReturnType<typeof buildApp>>

  const get = async <T>(path: string): Promise<T> => {
    const res = await app.inject({ method: 'GET', url: `/api/v1${path}` })
    expect(res.statusCode).toBe(200)
    return res.json()
  }

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

  it('returns every wine without parameters', async () => {
    expect(ids(await get<Wine[]>('/wines'))).toEqual(ids(wines))
  })

  it('combines wine filters like the shop page', async () => {
    const expected = wines.filter(
      (w) => !w.unlisted && ['Istria', 'Dalmatia'].includes(w.region) && w.so2 <= 30 && w.price <= 40,
    )
    const found = await get<Wine[]>('/wines?listed=true&region=Istria,Dalmatia&maxSo2=30&priceMax=40')
    expect(ids(found)).toEqual(ids(expected))
  })

  it('matches grapes by prefix and text in any field, ignoring case', async () => {
    const grape = await get<Wine[]>('/wines?grape=malvazija&grape=Teran')
    expect(ids(grape)).toEqual(ids(wines.filter((w) => /^(malvazija|teran)/i.test(w.grape))))

    const text = await get<Wine[]>('/wines?q=istria')
    expect(ids(text)).toEqual(
      ids(
        wines.filter((w) => [w.name, w.growerName, w.grape, w.region].some((s) => s?.toLowerCase().includes('istria'))),
      ),
    )
  })

  it('filters by boolean attributes and stock', async () => {
    const found = await get<Wine[]>('/wines?vegan=true&so2Added=false&inStock=true')
    expect(ids(found)).toEqual(ids(wines.filter((w) => w.vegan && !w.so2Added && w.left !== 0)))
  })

  it('sorts by price', async () => {
    const prices = (await get<Wine[]>('/wines?sort=price-desc')).map((w) => w.price)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  it('rejects unknown values', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/wines?sort=cheapest' })
    expect(res.statusCode).toBe(400)
  })

  it('filters oils by intensity and hides tasting sets', async () => {
    const found = await get<Oil[]>('/oils?level=Robust&set=false')
    expect(ids(found)).toEqual(ids(oils.filter((o) => o.level === 'Robust' && !o.set)))
    expect(ids(await get<Oil[]>('/oils?set=true'))).toEqual(ids(oils.filter((o) => o.set)))
  })
})
