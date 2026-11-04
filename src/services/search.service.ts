import type { DbOrTx } from '../db/client.ts'
import { search } from '../lib/search.ts'
import { findGrowers } from '../repositories/grower.repository.ts'
import { findOils } from '../repositories/oil.repository.ts'
import { findWines } from '../repositories/wine.repository.ts'

export async function searchCatalog(db: DbOrTx, query: string) {
  const [wines, oils, growers] = await Promise.all([findWines(db), findOils(db), findGrowers(db)])
  return search(query, { wines, oils, growers })
}
