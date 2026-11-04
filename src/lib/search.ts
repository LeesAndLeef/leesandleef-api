import type { Grower, Oil, Wine } from '../types/content.ts'

export interface SearchSource {
  wines: Wine[]
  oils: Oil[]
  growers: Grower[]
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

function matcher(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return (fields: (string | undefined)[]) => {
    const hay = normalize(fields.filter(Boolean).join(' '))
    return words.length > 0 && words.every((w) => hay.includes(w))
  }
}

export function search(query: string, { wines, oils, growers }: SearchSource): SearchSource {
  const match = matcher(query)
  return {
    wines: wines.filter((w) => match([w.name, w.growerName, w.grape, w.region, w.type, w.note, 'wine'])),
    oils: oils.filter((o) =>
      match([
        o.name,
        o.growerName,
        o.cultivar,
        o.origin,
        o.region,
        o.level,
        o.note,
        'olive oil',
        o.set ? 'gift set' : undefined,
      ]),
    ),
    growers: growers.filter((g) => match([g.name, g.people, g.place, g.region, ...g.grapes])),
  }
}
