import { desc, eq } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import { toArticle } from '../lib/mappers.ts'

export async function findArticles(db: DbOrTx) {
  const rows = await db.select().from(t.articles).orderBy(desc(t.articles.no))
  return rows.map(toArticle)
}

export async function findArticle(db: DbOrTx, slug: string) {
  const [row] = await db.select().from(t.articles).where(eq(t.articles.slug, slug))
  return row && toArticle(row)
}
