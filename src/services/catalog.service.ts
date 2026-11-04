import type { DbOrTx } from '../db/client.ts'
import { findArticle, findArticles } from '../repositories/article.repository.ts'
import { findClubPlans } from '../repositories/clubPlan.repository.ts'
import { findGrower, findGrowers } from '../repositories/grower.repository.ts'
import { findOil, findOils, type OilFilter } from '../repositories/oil.repository.ts'
import { findSite } from '../repositories/site.repository.ts'
import { findWine, findWines, type WineFilter } from '../repositories/wine.repository.ts'
import { notFound } from '../utils/errors.ts'

export const getSite = (db: DbOrTx) => findSite(db)

export const listWines = (db: DbOrTx, filter: WineFilter) => findWines(db, filter)

export async function getWine(db: DbOrTx, id: string) {
  const wine = await findWine(db, id)
  if (!wine) throw notFound(`Wine ${id} not found`)
  return wine
}

export const listOils = (db: DbOrTx, filter: OilFilter) => findOils(db, filter)

export async function getOil(db: DbOrTx, id: string) {
  const oil = await findOil(db, id)
  if (!oil) throw notFound(`Olive oil ${id} not found`)
  return oil
}

export const listClubPlans = (db: DbOrTx) => findClubPlans(db)

export const listGrowers = (db: DbOrTx) => findGrowers(db)

export async function getGrower(db: DbOrTx, id: string) {
  const grower = await findGrower(db, id)
  if (!grower) throw notFound(`Grower ${id} not found`)
  return grower
}

export const listArticles = (db: DbOrTx) => findArticles(db)

export async function getArticle(db: DbOrTx, slug: string) {
  const article = await findArticle(db, slug)
  if (!article) throw notFound(`Article ${slug} not found`)
  return article
}
