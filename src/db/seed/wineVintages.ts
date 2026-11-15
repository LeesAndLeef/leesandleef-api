import type { WineVintage } from '../../types/content.ts'
import type { WineSeed, WineVintageSeed } from './types.ts'

const vintageId = (styleId: string, vintage: string | null) => (vintage ? `${styleId}-${vintage}` : styleId)

const toVintage = (wine: WineSeed, { isDefault = false, ...vintage }: WineVintageSeed): WineVintage => ({
  ...vintage,
  id: vintageId(wine.id, vintage.vintage),
  name: vintage.vintage ? `${wine.name} ${vintage.vintage}` : wine.name,
  isDefault,
})

export const seedWineVintages = (wine: WineSeed): WineVintage[] =>
  wine.vintages.map((vintage) => toVintage(wine, vintage))
