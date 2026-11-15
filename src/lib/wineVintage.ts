import type { Wine } from '../types/content.ts'

export const defaultVintage = (wine: Pick<Wine, 'vintages'>) => wine.vintages.find((vintage) => vintage.isDefault)
