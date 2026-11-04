import { describe, expect, it } from 'vitest'
import { search } from '../src/lib/search.ts'
import type { Oil, Wine } from '../src/types/content.ts'
import { growers, oils, wines } from './fixtures.ts'

const source = { wines: wines as Wine[], oils: oils as Oil[], growers }

describe('search', () => {
  it('ignores accents and case', () => {
    const plain = search('posip', source)
    expect(plain.wines.length).toBeGreaterThan(0)
    expect(search('POŠIP', source).wines).toEqual(plain.wines)
  })

  it('requires every word to match', () => {
    expect(search('teran olive oil', source).wines).toEqual([])
  })

  it('returns nothing for a blank query', () => {
    expect(search('   ', source)).toEqual({ wines: [], oils: [], growers: [] })
  })
})
