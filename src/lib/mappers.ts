import type * as t from '../db/schema.ts'
import type { Article, ClubPlan, Grower, Oil, Wine } from '../types/content.ts'
import { compact } from '../utils/compact.ts'

type Row<T extends { $inferSelect: unknown }> = T['$inferSelect']

export function toWine({ position: _, unlisted, ...row }: Row<typeof t.wines>): Wine {
  return { kind: 'wine', ...compact(row), ...(unlisted && { unlisted }) }
}

export function toOil({ position: _, limited, ...row }: Row<typeof t.oils>): Oil {
  return { kind: 'oil', ...compact(row), ...(limited && { limited }) }
}

export function toClubPlan({
  position: _,
  priceSeason,
  priceMonth,
  description,
  featured,
  ...row
}: Row<typeof t.clubPlans>): ClubPlan {
  return {
    kind: 'club',
    ...row,
    ...(featured && { featured }),
    price: { season: priceSeason, month: priceMonth },
    desc: description,
  }
}

export function toGrower({ position: _, ...row }: Row<typeof t.growers>): Grower {
  return compact(row)
}

export function toArticle(row: Row<typeof t.articles>): Article {
  return row
}
