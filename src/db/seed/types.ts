import type { OilContent, OilSize, WineContent, WineVintage } from '../../types/content.ts'

export type OilSizeSeed = Pick<OilSize, 'size' | 'price'> & Partial<Pick<OilSize, 'label' | 'name' | 'left'>>

export type OilSeed = OilContent & { sizes: OilSizeSeed[] }

export type WineVintageSeed = Omit<WineVintage, 'id' | 'name' | 'isDefault'> & { isDefault?: boolean }

export type WineSeed = WineContent & { vintages: WineVintageSeed[] }
