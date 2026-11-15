import { describe, expect, it } from 'vitest'
import { lineKey, normalizeOption } from '../src/lib/cartOptions.ts'
import { item } from './fixtures.ts'

describe('normalizeOption', () => {
  it('takes wine vintages without options', () => {
    expect(normalizeOption(item('teran-crvena-zemlja-2022'), undefined)).toEqual({ ok: true, option: undefined })
    expect(normalizeOption(item('teran-crvena-zemlja-2022'), '2023').ok).toBe(false)
  })

  it('takes oil sizes and tasting sets without options', () => {
    expect(normalizeOption(item('istarska-bjelica-250'), undefined)).toEqual({ ok: true, option: undefined })
    expect(normalizeOption(item('istarska-bjelica-250'), '3000').ok).toBe(false)
    expect(normalizeOption(item('oil-tasting-set'), '250').ok).toBe(false)
  })

  it('defaults club plans to per season', () => {
    expect(normalizeOption(item('club-cellar'), undefined)).toEqual({ ok: true, option: 'season' })
    expect(normalizeOption(item('club-cellar'), 'weekly').ok).toBe(false)
  })
})

describe('lineKey', () => {
  it('joins id and option', () => {
    expect(lineKey('a')).toBe('a')
    expect(lineKey('a', '2022')).toBe('a@2022')
  })
})
