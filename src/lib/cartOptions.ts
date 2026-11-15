import { FREQS, MAX_CLUB_QTY, MAX_LINE_QTY } from '../config/constants.ts'
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
  return option === undefined
    ? valid(undefined)
    : invalid(`${item.name} has no options: each vintage and size has its own id`)
}

export const lineKey = (id: string, option?: string) => (option ? `${id}@${option}` : id)

export const maxQty = (item: CartItem) => (item.kind === 'club' ? MAX_CLUB_QTY : MAX_LINE_QTY)
