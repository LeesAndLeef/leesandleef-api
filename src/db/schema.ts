import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { OIL_LEVELS, ORDER_STATUSES, PAY_METHODS, SHIP_METHODS, WINE_TYPES } from '../config/constants.ts'
import type { Article, GrowerProfile, OilDetail, OilSet, QuizAnswer, Site, WineDetail } from '../types/content.ts'

const money = () => numeric({ precision: 10, scale: 2, mode: 'number' })
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()

export const wineType = pgEnum('wine_type', WINE_TYPES)
export const oilLevel = pgEnum('oil_level', OIL_LEVELS)
export const shipMethod = pgEnum('ship_method', SHIP_METHODS)
export const payMethod = pgEnum('pay_method', PAY_METHODS)
export const orderStatus = pgEnum('order_status', ORDER_STATUSES)

export const growers = pgTable('growers', {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  shortName: text().notNull(),
  place: text().notNull(),
  region: text().notNull(),
  who: text().notNull(),
  people: text().notNull(),
  ha: text().notNull(),
  since: text().notNull(),
  grapes: text().array().notNull(),
  tone: text().notNull(),
  quote: text().notNull(),
  portrait: text(),
  profile: jsonb().$type<GrowerProfile>(),
})

const productColumns = () => ({
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  growerId: text().references(() => growers.id),
  growerName: text(),
  region: text().notNull(),
  price: money().notNull(),
  left: integer(),
  glass: text().notNull(),
  cap: text().notNull(),
  note: text().notNull(),
})

export const wines = pgTable('wines', {
  ...productColumns(),
  type: wineType().notNull(),
  grape: text().notNull(),
  abv: text().notNull(),
  volume: text(),
  homeNote: text(),
  badge: text(),
  releaseRank: integer().notNull(),
  unlisted: boolean().notNull().default(false),
  so2: integer().notNull(),
  so2Added: boolean().notNull(),
  vegan: boolean().notNull(),
  amphora: boolean().notNull(),
  magnum: boolean().notNull(),
  detail: jsonb().$type<WineDetail>().notNull(),
})

export const oils = pgTable('oils', {
  ...productColumns(),
  cultivar: text().notNull(),
  origin: text().notNull(),
  level: oilLevel().notNull(),
  bitter: integer().notNull(),
  pepper: integer().notNull(),
  fruit: integer().notNull(),
  poly: text().notNull(),
  acid: text().notNull(),
  harvest: text().notNull(),
  limited: boolean().notNull().default(false),
  set: jsonb().$type<OilSet>(),
  detail: jsonb().$type<OilDetail>().notNull(),
})

export const clubPlans = pgTable('club_plans', {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  tag: text().notNull(),
  bottles: integer().notNull(),
  featured: boolean().notNull().default(false),
  priceSeason: money().notNull(),
  priceMonth: money().notNull(),
  description: text().notNull(),
  perks: text().array().notNull(),
})

export const articles = pgTable('articles', {
  slug: text().primaryKey(),
  no: integer().notNull().unique(),
  tag: text().notNull(),
  read: text().notNull(),
  title: text().notNull(),
  lede: text().notNull(),
  dek: text().notNull(),
  img: text().notNull(),
  alt: text().notNull(),
  caption: text().notNull(),
  pattern: text().$type<Article['pattern']>().notNull(),
  author: text().notNull(),
  authorImg: text().notNull(),
  date: text().notNull(),
  toc: jsonb().$type<Article['toc']>().notNull(),
  short: text().array().notNull(),
  productsTitle: text().notNull(),
  products: jsonb().$type<Article['products']>().notNull(),
})

export const quizQuestions = pgTable('quiz_questions', {
  position: integer().primaryKey(),
  q: text().notNull(),
  answers: jsonb().$type<QuizAnswer[]>().notNull(),
})

export const quizProfiles = pgTable('quiz_profiles', {
  style: wineType().primaryKey(),
  title: text().notNull(),
  text: text().notNull(),
})

export const siteSettings = pgTable('site_settings', {
  id: text().primaryKey().default('main'),
  data: jsonb().$type<Site>().notNull(),
})

export const promoCodes = pgTable('promo_codes', {
  code: text().primaryKey(),
  rate: numeric({ precision: 4, scale: 3, mode: 'number' }).notNull(),
  active: boolean().notNull().default(true),
})

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  phone: text(),
  street: text(),
  postcode: text(),
  city: text(),
  country: text(),
  door: text(),
  createdAt: createdAt(),
})

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    number: text().notNull().unique(),
    status: orderStatus().notNull(),
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    paymentIntentId: text().unique(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    phone: text(),
    shipMethod: shipMethod().notNull(),
    street: text(),
    postcode: text(),
    city: text(),
    country: text(),
    door: text(),
    payMethod: payMethod().notNull(),
    giftNote: text(),
    promo: text(),
    subtotal: money().notNull(),
    mixDiscount: money().notNull(),
    promoDiscount: money().notNull(),
    shipping: money().notNull(),
    total: money().notNull(),
    createdAt: createdAt(),
    paidAt: timestamp({ withTimezone: true }),
    confirmationSentAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.userId)],
)

export const orderLines = pgTable(
  'order_lines',
  {
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    itemId: text().notNull(),
    kind: text().$type<'wine' | 'oil' | 'club'>().notNull(),
    option: text(),
    name: text().notNull(),
    meta: text().notNull(),
    unit: money().notNull(),
    qty: integer().notNull(),
    total: money().notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.position] })],
)

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  email: text().primaryKey(),
  source: text().notNull(),
  createdAt: createdAt(),
})

export const visitRequests = pgTable('visit_requests', {
  id: uuid().primaryKey().defaultRandom(),
  growerId: text()
    .notNull()
    .references(() => growers.id),
  name: text().notNull(),
  email: text().notNull(),
  date: date({ mode: 'string' }).notNull(),
  guests: integer().notNull(),
  notes: text(),
  createdAt: createdAt(),
})
