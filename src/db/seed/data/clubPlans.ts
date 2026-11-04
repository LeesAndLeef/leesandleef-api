import type { ClubPlan } from '../../../types/content.ts'

export const clubPlans: ClubPlan[] = [
  {
    kind: 'club',
    id: 'club-explorer',
    name: 'Explorer',
    tag: 'Start here',
    bottles: 3,
    price: { season: 64, month: 59 },
    desc: 'Three bottles across colours. Ideal if you’re new to natural wine or live alone.',
    perks: ['3 bottles per box', '24 h early access', 'Field journal', 'Swap 1 bottle'],
  },
  {
    kind: 'club',
    id: 'club-cellar',
    name: 'Cellar',
    tag: 'Most chosen',
    bottles: 6,
    featured: true,
    price: { season: 119, month: 109 },
    desc: 'A proper half-case: two of each colour plus one members-only bottle.',
    perks: ['6 bottles per box', '48 h early access', 'Members-only cuvées', 'Swap 2 bottles', '10% off the shop'],
  },
  {
    kind: 'club',
    id: 'club-collector',
    name: 'Collector',
    tag: 'For the curious',
    bottles: 12,
    price: { season: 229, month: 209 },
    desc: 'Twelve bottles including library vintages and the occasional magnum.',
    perks: [
      '12 bottles per box',
      '72 h early access',
      'Library vintages & magnums',
      'Unlimited swaps',
      'Harvest weekend invite',
    ],
  },
]
