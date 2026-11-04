import { describe, expect, it } from 'vitest'
import { lineKey, normalizeOption } from '../src/lib/cartOptions.ts'
import { item, oils } from './fixtures.ts'

describe('normalizeOption', () => {
  it('accepts known vintages and rejects others', () => {
    expect(normalizeOption(item('teran-crvena-zemlja'), '2022')).toEqual({ ok: true, option: '2022' })
    expect(normalizeOption(item('teran-crvena-zemlja'), '1999').ok).toBe(false)
  })

  it('treats the default oil size as no option', () => {
    expect(normalizeOption(item('istarska-bjelica'), '500')).toEqual({ ok: true, option: undefined })
    expect(normalizeOption(item('istarska-bjelica'), '750').ok).toBe(false)
  })

  it('refuses sizes on tasting sets', () => {
    const set = oils.find((o) => o.set)
    if (!set) throw new Error('No tasting set fixture')
    expect(normalizeOption({ ...set }, '250').ok).toBe(false)
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
