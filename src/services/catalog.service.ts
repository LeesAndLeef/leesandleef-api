import { OIL_LEVELS, WINE_TYPES } from '../config/constants.ts'
import type { DbOrTx } from '../db/client.ts'
import { countsFor } from '../lib/counts.ts'
import { findArticle, findArticles } from '../repositories/article.repository.ts'
import { findClubPlans } from '../repositories/clubPlan.repository.ts'
import { findGrower, findGrowers } from '../repositories/grower.repository.ts'
import { countOilsByLevel, findOil, findOils, type OilFilter } from '../repositories/oil.repository.ts'
import { findSite } from '../repositories/site.repository.ts'
import {
  countWinesByRegion,
  countWinesByType,
  findWine,
  findWinePriceRange,
  findWines,
  type WineFilter,
} from '../repositories/wine.repository.ts'
import type { OilList, WineList } from '../types/content.ts'
import { notFound } from '../utils/errors.ts'

export const getSite = (db: DbOrTx) => findSite(db)

export async function listWines(db: DbOrTx, filter: WineFilter): Promise<WineList> {
  const { sort: _sort, ...criteria } = filter
  const [data, types, regions, price] = await Promise.all([
    findWines(db, filter),
    countWinesByType(db, { ...criteria, type: undefined }),
    countWinesByRegion(db, { ...criteria, region: undefined }),
    findWinePriceRange(db, { ...criteria, priceMin: undefined, priceMax: undefined }),
  ])
  return {
    data,
    meta: { total: data.length, types: countsFor(WINE_TYPES, types), regions: Object.fromEntries(regions), price },
  }
}

export async function getWine(db: DbOrTx, id: string) {
  const wine = await findWine(db, id)
  if (!wine) throw notFound(`Wine ${id} not found`)
  return wine
}

export async function listOils(db: DbOrTx, filter: OilFilter): Promise<OilList> {
  const [data, levels] = await Promise.all([
    findOils(db, filter),
    countOilsByLevel(db, { ...filter, level: undefined }),
  ])
  return { data, meta: { total: data.length, levels: countsFor(OIL_LEVELS, levels) } }
}

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
