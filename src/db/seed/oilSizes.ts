import { OIL_SIZES } from '../../config/constants.ts'
import type { OilSize } from '../../types/content.ts'
import type { OilSeed, OilSizeSeed } from './types.ts'

const sizeId = (styleId: string, size: OilSize['size']) => (size ? `${styleId}-${size}` : styleId)

function toSize(styleId: string, { size, label, name, ...stock }: OilSizeSeed): OilSize {
  const known = OIL_SIZES.find((entry) => entry.size === size)
  return {
    id: sizeId(styleId, size),
    size,
    label: label ?? known?.label ?? '',
    name: name ?? known?.name ?? '',
    ...stock,
  }
}

export const seedOilSizes = (oil: OilSeed): OilSize[] => oil.sizes.map((size) => toSize(oil.id, size))
