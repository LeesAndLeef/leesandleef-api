export type WineFilterType = 'Red' | 'White' | 'Orange' | 'Rosé' | 'Sparkling'
export type WineType = WineFilterType | 'Dessert'
export type WineSort = 'newest' | 'price-asc' | 'price-desc' | 'left'

export interface Vintage {
  year: string
  price: number
  info: string
}

export interface StructureBar {
  label: string
  value: number
  word: string
}

export interface GrowerQuote {
  text: string
  who: string
  role: string
  facts: string
}

export interface RelatedProduct {
  id: string
  why: string
}

export interface WineDetail {
  story: string
  tags: string[]
  vintages?: Vintage[]
  defaultVintage?: string
  drinkWindow: { label: string; cells: number[] }
  tasting: { nose: string; palate: string; finish: string }
  structure: StructureBar[]
  serve: { temp: string; decant: string; glass: string }
  pairings: { dish: string; kind: string }[]
  vineyard: [string, string][]
  vineyardMap: string
  cellar: [string, string][]
  quote: GrowerQuote & { portrait: string }
  related: RelatedProduct[]
}

interface BaseProduct {
  id: string
  name: string
  growerId?: string
  growerName?: string
  region: string
  price: number
  left?: number
  glass: string
  cap: string
  note: string
}

export interface Wine extends BaseProduct {
  kind: 'wine'
  type: WineType
  grape: string
  abv: string
  volume?: string
  homeNote?: string
  badge?: string
  releaseRank: number
  unlisted?: boolean
  so2: number
  so2Added: boolean
  vegan: boolean
  amphora: boolean
  magnum: boolean
  detail: WineDetail
}

export type OilLevel = 'Delicate' | 'Medium' | 'Robust'

export type OilTrait = 'fruit' | 'bitter' | 'pepper'

export interface Photo {
  img: string
  alt: string
  caption: string
}

export interface OilDetail {
  style: string
  story: string
  tags: string[]
  stageFact: { label: string; value: string; text: string }
  traits: Record<OilTrait, string>
  lot: string
  tasting: { nose: string; palate: string; finish: string }
  uses: { dish: string; kind: string }[]
  peroxide: string
  grove: [string, string][]
  grovePhoto: Photo
  quote?: GrowerQuote
  related: RelatedProduct[]
}

export interface OilSet {
  was: number
  contents: string
}

export interface Oil extends BaseProduct {
  kind: 'oil'
  cultivar: string
  origin: string
  level: OilLevel
  bitter: number
  pepper: number
  fruit: number
  poly: string
  acid: string
  harvest: string
  limited?: boolean
  set?: OilSet
  detail: OilDetail
}

export type Product = Wine | Oil

export type Freq = 'season' | 'month'

export interface ClubPlan {
  kind: 'club'
  id: string
  name: string
  tag: string
  bottles: number
  featured?: boolean
  price: Record<Freq, number>
  desc: string
  perks: string[]
}

export type CartItem = Product | ClubPlan

export interface GrowerMonth {
  name: string
  short: string
  phase: string
  intensity: number
  text: string
  vine: string
  cellar: string
  hands: string
  food: string
}

export type PlotTone = 'wine' | 'olive' | 'dark' | 'dashed'

export interface Plot {
  name: string
  grape: string
  soil: string
  size: string
  planted: string
  map: { label?: string; x: number; y: number; w: number; h: number; tone: PlotTone }
}

export interface GrowerProfile {
  heroPhoto: string
  heroImg: string
  facts: [string, string][]
  storyTitle: string
  story: string[]
  pullQuote: string
  pullQuoteBy: string
  photos: Photo[]
  checklist: { text: string; done: boolean }[]
  yearLabel: string
  year: GrowerMonth[]
  defaultMonth: number
  plotsTitle: string
  plotsIntro?: string
  plots: Plot[]
  landmark: { label: string; x: number; y: number; w: number; h: number }
  mapLegend: [string, string]
  winesTitle: string
  visit?: { title: string; host: string; intro: string; formTitle: string; rows: [string, string][] }
}

export interface Grower {
  id: string
  name: string
  shortName: string
  place: string
  region: string
  who: string
  people: string
  ha: string
  since: string
  grapes: string[]
  tone: string
  quote: string
  portrait?: string
  profile?: GrowerProfile
}

export type ArticlePattern = 'hatch' | 'hatch-w'

export interface Article {
  slug: string
  no: number
  tag: string
  read: string
  title: string
  lede: string
  dek: string
  img: string
  alt: string
  caption: string
  pattern: ArticlePattern
  author: string
  authorImg: string
  date: string
  toc: { id: string; title: string }[]
  short: string[]
  productsTitle: string
  products: { id: string; note: string }[]
}

export interface QuizAnswer {
  label: string
  styles: Partial<Record<WineFilterType, number>>
  bold?: number
}

export interface QuizQuestion {
  q: string
  answers: QuizAnswer[]
}

export interface QuizProfile {
  title: string
  text: string
}

export interface Site {
  releaseShipDate: string
  nextBoxCloses: string
  street: string
  city: string
  hours: string
  email: string
  shipCountries: string[]
  nonEuShippingYear: string
}
