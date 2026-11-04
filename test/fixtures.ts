import { clubPlans } from '../src/db/seed/data/clubPlans.ts'
import { growers } from '../src/db/seed/data/growers.ts'
import { oils } from '../src/db/seed/data/oils.ts'
import { quiz } from '../src/db/seed/data/quiz.ts'
import { wines } from '../src/db/seed/data/wines.ts'
import type { CartItem } from '../src/types/content.ts'

export { growers, oils, quiz, wines }

export const items = new Map<string, CartItem>([...wines, ...oils, ...clubPlans].map((item) => [item.id, item]))

export function item(id: string): CartItem {
  const found = items.get(id)
  if (!found) throw new Error(`Fixture ${id} missing`)
  return found
}
