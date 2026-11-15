import { clubPlans } from '../src/db/seed/data/clubPlans.ts'
import { growers } from '../src/db/seed/data/growers.ts'
import { oils as oilSeeds } from '../src/db/seed/data/oils.ts'
import { quiz } from '../src/db/seed/data/quiz.ts'
import { wines as wineSeeds } from '../src/db/seed/data/wines.ts'
import { seedOilSizes } from '../src/db/seed/oilSizes.ts'
import { seedWineVintages } from '../src/db/seed/wineVintages.ts'
import type { CartItem, Oil, SellableOil, SellableWine, Wine } from '../src/types/content.ts'

const wines: Wine[] = wineSeeds.map((seed) => ({ ...seed, vintages: seedWineVintages(seed) }))

const sellableWines: SellableWine[] = wines.flatMap((wine) =>
  wine.vintages.map((vintage) => ({ ...wine, id: vintage.id, price: vintage.price, vintage })),
)

const oils: Oil[] = oilSeeds.map((seed) => {
  const { sizes: _, ...oil } = seed
  return { ...oil, sizes: seedOilSizes(seed) }
})

const sellableOils: SellableOil[] = oils.flatMap((oil) =>
  oil.sizes.map((size) => ({ ...oil, id: size.id, price: size.price, size })),
)

export { growers, oils, quiz, wines }

export const items = new Map<string, CartItem>(
  [...sellableWines, ...sellableOils, ...clubPlans].map((item) => [item.id, item]),
)

export function item(id: string): CartItem {
  const found = items.get(id)
  if (!found) throw new Error(`Fixture ${id} missing`)
  return found
}
