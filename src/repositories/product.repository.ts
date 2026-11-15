import { inArray } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toClubPlan } from '../lib/mappers.ts'
import type { CartItem } from '../types/content.ts'
import { findSellableOils } from './oil.repository.ts'
import { findSellableWines } from './wine.repository.ts'

export async function findItems(db: DbOrTx, ids: string[]): Promise<Map<string, CartItem>> {
  if (ids.length === 0) return new Map()
  const unique = [...new Set(ids)]
  const wines = await findSellableWines(db, unique)
  const oils = await findSellableOils(db, unique)
  const planRows = await db.select().from(t.clubPlans).where(inArray(t.clubPlans.id, unique))
  const items: CartItem[] = [...wines, ...oils, ...planRows.map(toClubPlan)]
  return new Map(items.map((item) => [item.id, item]))
}

export async function findItem(db: DbOrTx, id: string) {
  return (await findItems(db, [id])).get(id)
}
