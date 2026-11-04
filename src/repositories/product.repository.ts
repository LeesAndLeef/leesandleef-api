import { inArray } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toClubPlan, toOil, toWine } from '../lib/mappers.ts'
import type { CartItem } from '../types/content.ts'

export async function findItems(db: DbOrTx, ids: string[]): Promise<Map<string, CartItem>> {
  if (ids.length === 0) return new Map()
  const unique = [...new Set(ids)]
  const wineRows = await db.select().from(t.wines).where(inArray(t.wines.id, unique))
  const oilRows = await db.select().from(t.oils).where(inArray(t.oils.id, unique))
  const planRows = await db.select().from(t.clubPlans).where(inArray(t.clubPlans.id, unique))
  const items: CartItem[] = [...wineRows.map(toWine), ...oilRows.map(toOil), ...planRows.map(toClubPlan)]
  return new Map(items.map((item) => [item.id, item]))
}

export async function findItem(db: DbOrTx, id: string) {
  return (await findItems(db, [id])).get(id)
}
