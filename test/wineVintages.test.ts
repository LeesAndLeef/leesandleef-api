import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { createDb } from '../src/db/client.ts'
import type { Wine, WineList } from '../src/types/content.ts'

const url = process.env.DATABASE_URL

describe.skipIf(!url)('wine vintages', () => {
  const { db, pool } = createDb(url ?? '')
  let app: Awaited<ReturnType<typeof buildApp>>

  const get = async <T>(path: string): Promise<T> => (await app.inject({ method: 'GET', url: `/api/v1${path}` })).json()
  const add = (id: string) => app.inject({ method: 'POST', url: '/api/v1/cart/lines', payload: { id } })

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

  it('lists every vintage of a wine with its own id, price, stock and pre-order', async () => {
    const wine = await get<Wine>('/wines/teran-crvena-zemlja')
    expect(wine.name).toBe('Teran “Crvena Zemlja”')
    expect(wine.vintages).toEqual([
      {
        id: 'teran-crvena-zemlja-2022',
        vintage: '2022',
        name: 'Teran “Crvena Zemlja” 2022',
        price: 26,
        left: 12,
        isDefault: false,
      },
      {
        id: 'teran-crvena-zemlja-2023',
        vintage: '2023',
        name: 'Teran “Crvena Zemlja” 2023',
        price: 24,
        left: 118,
        isDefault: true,
      },
      {
        id: 'teran-crvena-zemlja-2024',
        vintage: '2024',
        name: 'Teran “Crvena Zemlja” 2024',
        price: 23,
        preOrder: 'Mar',
        isDefault: false,
      },
    ])
  })

  it('keeps price, stock and badge off the wine style and dates its release', async () => {
    const wine = await get<Wine>('/wines/teran-crvena-zemlja-2022')
    expect(wine.id).toBe('teran-crvena-zemlja')
    for (const field of ['price', 'left', 'badge', 'releaseRank']) expect(wine).not.toHaveProperty(field)
    expect(new Date(wine.releaseDate).toISOString()).toBe(wine.releaseDate)
  })

  it('lists newest releases first by default', async () => {
    const dates = (await get<WineList>('/wines')).data.map((wine) => wine.releaseDate)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('sells vintages by id and asks for a vintage when given the wine', async () => {
    const added = await add('teran-crvena-zemlja-2022')
    expect(added.json().lines[0]).toMatchObject({ unit: 26, name: 'Teran “Crvena Zemlja” 2022' })
    const plain = await add('teran-crvena-zemlja')
    expect(plain.statusCode).toBe(422)
    expect(plain.json().message).toContain('teran-crvena-zemlja-2023')
  })

  it('sells a wine without a vintage under its own id', async () => {
    const added = await add('prosek-strpljenje')
    expect(added.json().lines[0]).toMatchObject({ id: 'prosek-strpljenje', unit: 38 })
  })
})
