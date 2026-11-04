import { DEFAULT_OIL_SIZE, FREQS, MAX_CLUB_QTY, MAX_LINE_QTY, OIL_SIZES } from '../config/constants.ts'
import type { CartItem } from '../types/content.ts'

export type OptionResult = { ok: true; option: string | undefined } | { ok: false; message: string }

const valid = (option: string | undefined): OptionResult => ({ ok: true, option })
const invalid = (message: string): OptionResult => ({ ok: false, message })

export function normalizeOption(item: CartItem, option: string | undefined): OptionResult {
  if (item.kind === 'club') {
    const freq = option ?? 'season'
    return (FREQS as readonly string[]).includes(freq)
      ? valid(freq)
      : invalid(`Club option must be one of ${FREQS.join(', ')}`)
  }
  if (item.kind === 'wine') {
    if (option === undefined) return valid(undefined)
    const years = item.detail.vintages?.map((v) => v.year) ?? []
    return years.includes(option) ? valid(option) : invalid(`${item.name} has no ${option} vintage`)
  }
  if (item.set) return option === undefined ? valid(undefined) : invalid(`${item.name} comes in one size only`)
  if (option === undefined || option === DEFAULT_OIL_SIZE) return valid(undefined)
  return OIL_SIZES.some((size) => size.id === option)
    ? valid(option)
    : invalid(`Oil size must be one of ${OIL_SIZES.map((size) => size.id).join(', ')}`)
}

export const lineKey = (id: string, option?: string) => (option ? `${id}@${option}` : id)

export const maxQty = (item: CartItem) => (item.kind === 'club' ? MAX_CLUB_QTY : MAX_LINE_QTY)
