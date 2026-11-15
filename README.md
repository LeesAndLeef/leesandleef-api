# Lees & Leaf API

Backend for the [Lees & Leaf storefront](../leesandleef-ui). It serves the catalog, prices carts on the server, runs customer accounts, takes orders and payments (Stripe or bank transfer), sends order emails, and records newsletter signups and cellar visit requests.

Fastify 5, Zod 4, PostgreSQL with Drizzle ORM, Stripe, Resend, TypeScript, yarn 4.

## Getting started

```sh
yarn
cp .env.example .env            # point DATABASE_URL at your Postgres, fill JWT_SECRET and COOKIE_SECRET
docker compose up -d            # optional: Postgres 17 on localhost:5433
yarn db:migrate
yarn db:seed                    # loads the storefront content and the HARVEST10 promo
yarn dev                        # http://localhost:3000, docs at /docs
```

## Commands

```sh
yarn dev            # watch mode
yarn build          # compile to dist/
yarn start          # run dist/server.js
yarn typecheck
yarn test           # Vitest; the checkout test also runs when DATABASE_URL is set
yarn check          # Biome (check:fix to format)
yarn db:generate    # new migration from src/db/schema.ts changes
yarn db:migrate
yarn db:seed        # replaces catalog content, keeps accounts and orders
yarn db:studio      # Drizzle Studio
```

## Endpoints

Everything sits under `/api/v1`, except `/health` and `/webhooks/stripe`. Interactive docs are at `/docs` (OpenAPI JSON at `/docs/json`). Pictures are served from `/assets/...`, and image fields in responses hold those paths.

| Method       | Path                              |                                                                                                            |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| GET          | `/site`                           | Shop details (address, hours, ship countries, next box cutoff)                                             |
| GET          | `/wines`                          | `{ data, meta }`: wines, filtered and sorted, with filter counts (see Catalog filters)                     |
| GET          | `/wines/:id`                      |                                                                                                            |
| GET          | `/oils`                           | `{ data, meta }`: olive oils and tasting sets, with counts per intensity (see Catalog filters)             |
| GET          | `/oils/:id`                       | An oil by its id or by one of its size ids, with all its `sizes`                                           |
| GET          | `/club-plans`                     |                                                                                                            |
| GET          | `/growers`, `/growers/:id`        |                                                                                                            |
| POST         | `/growers/:id/visits`             | `{ name, email, date, guests, notes? }`                                                                    |
| GET          | `/articles`, `/articles/:slug`    | Journal (article bodies stay in the UI)                                                                    |
| GET          | `/search?q=`                      | `{ wines, oils, growers }`                                                                                 |
| GET          | `/quiz`                           | `{ questions, profiles }`                                                                                  |
| POST         | `/quiz/recommendations`           | `{ answers: number[] }` → `{ top, profile, wines }`                                                        |
| GET          | `/cart`                           | Priced cart: `{ lines, saved, promo, giftNote, totals }`                                                   |
| GET          | `/cart/shipping-options`          | Standard, Saturday and pickup prices for this cart                                                         |
| POST         | `/cart/lines`                     | `{ id, qty?, option? }`: id of a wine vintage, oil size, tasting set or plan; option is the club frequency |
| PATCH        | `/cart/lines/:key`                | `{ qty }`                                                                                                  |
| DELETE       | `/cart/lines/:key`                |                                                                                                            |
| POST         | `/cart/lines/:key/save-for-later` |                                                                                                            |
| POST         | `/cart/saved/:key/move-to-cart`   |                                                                                                            |
| DELETE       | `/cart/saved/:key`                |                                                                                                            |
| PUT / DELETE | `/cart/promo`                     | `{ code }`, 422 if the code is unknown                                                                     |
| PUT          | `/cart/gift-note`                 | `{ note }` (`null` clears it)                                                                              |
| DELETE       | `/cart`                           | Empties the cart, keeps saved items                                                                        |
| POST         | `/auth/signup`                    | `{ email, password, firstName, lastName, phone? }`, logs in, 409 if the email is taken                     |
| POST         | `/auth/login`, `/auth/logout`     | `{ email, password }` / nothing                                                                            |
| GET / PATCH  | `/account` 🔒                     | `{ firstName?, lastName?, phone?, address? }`                                                              |
| POST         | `/orders` 🔒                      | `{ details, ship, address?, pay }` → `{ order, payment }` (see Payments)                                   |
| GET          | `/orders` 🔒                      | Your orders, newest first                                                                                  |
| GET          | `/orders/:id` 🔒                  | One of your orders; re-checks a pending card payment                                                       |
| POST         | `/newsletter`                     | `{ email, source? }`                                                                                       |

## Catalog filters

Both answer `{ data, meta }`. Without parameters, `data` holds everything (unlisted wines flagged with `unlisted: true`, tasting sets with a `set` field). Every parameter narrows the list, and they combine with AND. List parameters take repeated values or commas (`region=Istria&region=Dalmatia` or `region=Istria,Dalmatia`). Booleans are `true` or `false`.

- `/wines`: `type`, `growerId`, `q` (text in name, grower, grape or region), `region`, `grape` (matches the start of the grape, so `Malvazija` finds `Malvazija Istarska`), `priceMin`, `priceMax`, `maxSo2` (mg/L), `so2Added=false` (zero added SO₂), `vegan`, `amphora`, `magnum`, `inStock`, `listed=true` (hide unlisted wines), `sort` (`newest`, `price-asc`, `price-desc`, `left`; default `newest`, latest `releaseDate` first). Price, stock and their filters use each wine's default vintage.
- `/oils`: `growerId`, `level` (`Delicate`, `Medium`, `Robust`), `set=false` (hide tasting sets).

The shop's wine page is `/wines?listed=true&…` and its oil page `/oils?set=false&…`. Text matching ignores case but not accents.

`meta` carries what the filter controls show, so a page needs one request. Each count applies every filter except its own, so it tells how many results that choice would give:

- `/wines`: `total` (wines in `data`), `types` (every type, with every filter but `type`), `regions` (regions that have wines, with every filter but `region`), `price` (`{ min, max }` with every filter but price, or `null`).
- `/oils`: `total`, `levels` (every intensity, with every filter but `level`).

## Wine vintages

Wines live in two tables. `wine_styles` holds what every vintage of a wine shares (name without the year, grower, grape, type, SO₂, tasting notes, `detail`, and `releaseDate`, an ISO timestamp). `wines` holds the products you can buy, one row per vintage, each with its own id, name with the year, stored price, optional stock (`left`) and pre-order month (`preOrder`), and `isDefault` for the vintage shown first (`teran-crvena-zemlja-2022`, `teran-crvena-zemlja-2023`). Each wine in a response lists them in `vintages`: `[{ id, vintage, name, price, left?, preOrder?, isDefault }]`. Add a vintage to the cart by its id; adding the plain wine id answers 422 with the vintage ids to choose from. `/wines/:id` accepts the wine id or any of its vintage ids. A wine without a vintage has one entry with `vintage: null` and the wine's own id (`prosek-strpljenje`). Magnums are a flag on the style (`magnum`), not products: there is no magnum price or stock yet.

## Olive oil sizes

Olive oils live in two tables. `oil_styles` holds what all sizes of an oil share (name, grower, cultivar, intensity, tasting notes, `detail`, and `releaseDate`, an ISO timestamp; lists show the newest first). `oils` holds the products you can buy, one row per size, each with its own id, stored price and optional stock (`left`) (`istarska-bjelica-250`, `istarska-bjelica-500`, `istarska-bjelica-3000`). Each oil in a response lists them in `sizes`, smallest first: `[{ id, size, label, name, price, left? }]`. Add a size to the cart by its id; adding the plain oil id answers 422 with the size ids to choose from. `/oils/:id` accepts the oil id or any of its size ids and returns the same oil, so a size's page can offer the other sizes. An oil in a response has no `price` or `left` of its own: those live only on its sizes. A tasting set has one entry in `sizes`, with `size: null` and the set's own id (`oil-tasting-set`).

Content responses use the same shape as the UI's `src/data/` types (minus `path`, which the UI's `src/lib/` adds), so the access layer can swap its imports for fetches.

## Cart

The cart lives only in an httpOnly `cart` cookie, signed with `COOKIE_SECRET` so it can't be edited, and holds the lines, saved items, promo code, gift note and a pending card order. Nothing about it is stored in the database, and it isn't tied to an account, so it stays in one browser. It holds at most 20 different items per list. The frontend must call the API with `credentials: 'include'`. CORS allows the origins in `CORS_ORIGIN` (comma-separated) with credentials. In development, Vite on `localhost:5173` and the API on `localhost:3000` count as the same site, so the cookie works; in production, serve both from the same site (for example `/api` behind the same domain).

Every cart response is priced on the server with the shop rules from `src/lib/pricing.ts`: −10% on 6+ wine bottles, promo codes from the `promo_codes` table applied to goods after that discount, free EU shipping from €120 of goods (otherwise €9.90), Club plans excluded from discounts and shipping, one Club plan per cart, at most 24 of a product. Line keys are `id` or `id@option`.

Orders re-price the cart in the same transaction, so clients can't change totals.

## Accounts

Browsing and the cart are public; checking out needs an account (🔒 in the table). `POST /auth/signup` and `/auth/login` set an httpOnly `session` cookie holding a JWT signed with `JWT_SECRET`, valid for 30 days; `/auth/logout` clears it. Passwords are hashed with scrypt. Protected routes answer 401 without a valid session. The order email always goes to the account email, and each order saves its name, phone and delivery address back to the account to prefill the next checkout.

## Payments

`POST /orders` stores the order and answers with the order and what the customer should do next:

- **Card or Apple / Google Pay** (`pay: 'card' | 'wallet'`): the order is `pending_payment` and `payment` is `{ method: 'stripe', clientSecret }`. Mount Stripe's Payment Element with that secret and call `stripe.confirmPayment()`; it offers cards and wallets by itself. The cart stays as it is until payment succeeds, so a declined card loses nothing. When Stripe sends `payment_intent.succeeded` to the webhook, the API checks the amount, marks the order `paid` and sends the confirmation email. The cart cookie remembers the pending order, so the next cart request from that browser empties it. After `confirmPayment()` the frontend can call `GET /orders/:id`, which also asks Stripe directly in case the webhook hasn't arrived yet.
- **Bank transfer** (`pay: 'bank'`): the order is `awaiting_transfer`, the cart is emptied, and `payment` is `{ method: 'bank', beneficiary, iban, bic?, reference, amount }`. The same details go out by email. Turn the option off by leaving `BANK_IBAN` empty.
- **No Stripe keys** (development): card orders are paid on the spot and `payment` is `{ method: 'none' }`.

Statuses: `pending_payment`, `awaiting_transfer`, `paid`, `shipped`, `cancelled`. The confirmation email is sent once per order, even when Stripe retries a webhook.

To set up Stripe, put the test keys in `.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), and in development forward events with the Stripe CLI:

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe   # prints the whsec_ secret
```

In production, add a webhook endpoint at `https://<api-host>/webhooks/stripe` for `payment_intent.succeeded`, `payment_intent.payment_failed` and `payment_intent.canceled` in the Stripe dashboard.

## Email

With `RESEND_API_KEY` set, emails go through [Resend](https://resend.com) from `EMAIL_FROM` (a domain verified in Resend). Without it, they are written to the server log. Production requires both Stripe and Resend keys.

## Layout

A request goes route → controller → service → repository, with Zod DTOs describing what goes in and out.

```
src/
  server.ts            starts the server: reads env, picks adapters, listens
  app.ts               buildApp(): registers plugins and routes (tests use it too)
  config/              env.ts (validated environment), constants.ts (shop rules)
  routes/              URL tree: one index.ts per path, mapping methods to controllers
    api/<resource>/      site, wines, oils, club-plans, growers, articles, search, quiz, cart, auth, account, orders, newsletter
    webhooks/stripe/     raw-body webhook endpoint
    health/
  controllers/         HTTP layer: read the request, call a service, shape the reply
  dto/                 Zod schemas per route: params, query, body, responses (also feed /docs)
  services/            use cases and business rules; take the database or Deps, know nothing about HTTP
  repositories/        Drizzle queries, one file per table or aggregate
  adapters/            outside services behind an interface: payments (Stripe, fake), email (Resend, log)
  plugins/             Fastify plugins: dependencies, error handler, CORS, cookies, JWT auth, static assets, Swagger
  lib/                 domain logic without I/O: pricing, cart options, search, quiz scoring, order view, email templates
  utils/               generic helpers: errors, money, HTML escaping, null stripping
  types/               domain, account, cart, order, dependency and Fastify types
  db/                  Drizzle schema, client, migration runner, seed (seed/data is the storefront content)
drizzle/               SQL migrations
public/assets/         pictures served at /assets
test/                  Vitest
```

To add an endpoint, add a schema to `dto/`, a function to `services/` (and to `repositories/` if it needs a new query), a handler to `controllers/`, then wire it in `routes/api/<resource>/index.ts`. Controllers are typed from the DTO with `Request<typeof schema>` and `Reply<typeof schema>` from `types/http.ts`.
