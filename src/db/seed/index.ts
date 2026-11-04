import { SEED_PROMO_CODES } from '../../config/constants.ts'
import { env } from '../../config/env.ts'
import type { WineFilterType } from '../../types/content.ts'
import { createDb } from '../client.ts'
import * as t from '../schema.ts'
import { articles } from './data/articles.ts'
import { clubPlans } from './data/clubPlans.ts'
import { growers } from './data/growers.ts'
import { oils } from './data/oils.ts'
import { quiz, quizProfiles } from './data/quiz.ts'
import { site } from './data/site.ts'
import { wines } from './data/wines.ts'

const { db, pool } = createDb(env.DATABASE_URL)

await db.transaction(async (tx) => {
  await tx.delete(t.wines)
  await tx.delete(t.oils)
  await tx.delete(t.clubPlans)
  await tx.delete(t.articles)
  await tx.delete(t.quizQuestions)
  await tx.delete(t.quizProfiles)
  await tx.delete(t.siteSettings)
  await tx.delete(t.visitRequests)
  await tx.delete(t.growers)

  await tx.insert(t.growers).values(growers.map((grower, position) => ({ ...grower, position })))
  await tx.insert(t.wines).values(wines.map(({ kind: _, ...wine }, position) => ({ ...wine, position })))
  await tx.insert(t.oils).values(oils.map(({ kind: _, ...oil }, position) => ({ ...oil, position })))
  await tx.insert(t.clubPlans).values(
    clubPlans.map(({ kind: _, price, desc, ...plan }, position) => ({
      ...plan,
      position,
      priceSeason: price.season,
      priceMonth: price.month,
      description: desc,
    })),
  )
  await tx.insert(t.articles).values(articles)
  await tx.insert(t.quizQuestions).values(quiz.map((question, position) => ({ ...question, position })))
  await tx
    .insert(t.quizProfiles)
    .values(Object.entries(quizProfiles).map(([style, profile]) => ({ style: style as WineFilterType, ...profile })))
  await tx.insert(t.siteSettings).values({ data: site })
  await tx.insert(t.promoCodes).values(SEED_PROMO_CODES).onConflictDoNothing()
})

await pool.end()
console.log(
  `Seeded ${wines.length} wines, ${oils.length} oils, ${growers.length} growers, ${articles.length} articles, ${clubPlans.length} club plans`,
)
