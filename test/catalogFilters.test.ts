import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { createDb } from '../src/db/client.ts'
import { defaultVintage } from '../src/lib/wineVintage.ts'
import type { Oil, OilList, Wine, WineList } from '../src/types/content.ts'
import { oils as oilFixtures, wines as wineFixtures } from './fixtures.ts'

const url = process.env.DATABASE_URL
const wines = wineFixtures as Wine[]
const oils = oilFixtures as Oil[]

const ids = (list: { id: string }[]) => list.map((item) => item.id).sort()
const priceOf = (wine: Wine) => defaultVintage(wine)?.price ?? 0
const leftOf = (wine: Wine) => defaultVintage(wine)?.left

describe.skipIf(!url)('catalog filters', () => {
  const { db, pool } = createDb(url ?? '')
  let app: Awaited<ReturnType<typeof buildApp>>

  const get = async <T>(path: string): Promise<T> => {
    const res = await app.inject({ method: 'GET', url: `/api/v1${path}` })
    expect(res.statusCode).toBe(200)
    return res.json()
  }

  const findWines = async (query: string) => (await get<WineList>(`/wines${query}`)).data
  const findOils = async (query: string) => (await get<OilList>(`/oils${query}`)).data

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
    expect(ids(await findWines(''))).toEqual(ids(wines))
  })

  it('combines wine filters like the shop page', async () => {
    const expected = wines.filter(
      (w) => !w.unlisted && ['Istria', 'Dalmatia'].includes(w.region) && w.so2 <= 30 && priceOf(w) <= 40,
    )
    const found = await findWines('?listed=true&region=Istria,Dalmatia&maxSo2=30&priceMax=40')
    expect(ids(found)).toEqual(ids(expected))
  })

  it('matches grapes by prefix and text in any field, ignoring case', async () => {
    const grape = await findWines('?grape=malvazija&grape=Teran')
    expect(ids(grape)).toEqual(ids(wines.filter((w) => /^(malvazija|teran)/i.test(w.grape))))

    const text = await findWines('?q=istria')
    expect(ids(text)).toEqual(
      ids(
        wines.filter((w) => [w.name, w.growerName, w.grape, w.region].some((s) => s?.toLowerCase().includes('istria'))),
      ),
    )
  })

  it('filters by boolean attributes and stock', async () => {
    const found = await findWines('?vegan=true&so2Added=false&inStock=true')
    expect(ids(found)).toEqual(ids(wines.filter((w) => w.vegan && !w.so2Added && leftOf(w) !== 0)))
  })

  it('sorts by price', async () => {
    const prices = (await findWines('?sort=price-desc')).map(priceOf)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  it('counts every type, region and price with the other filters applied', async () => {
    const { data, meta } = await get<WineList>('/wines?listed=true&type=Red&region=Istria&vegan=true')
    const shown = wines.filter((w) => !w.unlisted && w.vegan)
    const count = (match: (w: Wine) => boolean) => shown.filter(match).length

    expect(meta.total).toBe(data.length)
    expect(meta.types).toEqual({
      Red: count((w) => w.region === 'Istria' && w.type === 'Red'),
      White: count((w) => w.region === 'Istria' && w.type === 'White'),
      Orange: count((w) => w.region === 'Istria' && w.type === 'Orange'),
      Rosé: count((w) => w.region === 'Istria' && w.type === 'Rosé'),
      Sparkling: count((w) => w.region === 'Istria' && w.type === 'Sparkling'),
      Dessert: count((w) => w.region === 'Istria' && w.type === 'Dessert'),
    })
    const reds = shown.filter((w) => w.type === 'Red')
    expect(meta.regions).toEqual(
      Object.fromEntries(
        Object.entries(Object.groupBy(reds, (w) => w.region)).map(([region, list]) => [region, list?.length]),
      ),
    )
    const prices = shown.filter((w) => w.type === 'Red' && w.region === 'Istria').map(priceOf)
    expect(meta.price).toEqual(prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null)
  })

  it('keeps the price range while a price filter narrows the list', async () => {
    const { meta } = await get<WineList>('/wines?listed=true&priceMin=1000')
    expect(meta.total).toBe(0)
    const prices = wines.filter((w) => !w.unlisted).map(priceOf)
    expect(meta.price).toEqual({ min: Math.min(...prices), max: Math.max(...prices) })
  })

  it('rejects unknown values', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/wines?sort=cheapest' })
    expect(res.statusCode).toBe(400)
  })

  it('filters oils by intensity and hides tasting sets', async () => {
    const found = await findOils('?level=Robust&set=false')
    expect(ids(found)).toEqual(ids(oils.filter((o) => o.level === 'Robust' && !o.set)))
    expect(ids(await findOils('?set=true'))).toEqual(ids(oils.filter((o) => o.set)))
  })

  it('counts oils per intensity, ignoring the chosen intensity', async () => {
    const { meta } = await get<OilList>('/oils?level=Robust&set=false')
    const listed = oils.filter((o) => !o.set)
    expect(meta.levels).toEqual({
      Delicate: listed.filter((o) => o.level === 'Delicate').length,
      Medium: listed.filter((o) => o.level === 'Medium').length,
      Robust: listed.filter((o) => o.level === 'Robust').length,
    })
  })
})
