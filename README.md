# Lees & Leaf API

Backend for the [Lees & Leaf storefront](../leesandleef-ui). It serves the catalog, prices carts on the server, takes orders and payments (Stripe or bank transfer), sends order emails, and records newsletter signups and cellar visit requests.

Fastify 5, Zod 4, PostgreSQL with Drizzle ORM, Stripe, Resend, TypeScript, yarn 4.

## Getting started

```sh
yarn
cp .env.example .env            # point DATABASE_URL at your Postgres
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
yarn db:seed        # replaces catalog content, keeps carts and orders
yarn db:studio      # Drizzle Studio
```

## Endpoints

Everything sits under `/api/v1`, except `/health` and `/webhooks/stripe`. Interactive docs are at `/docs` (OpenAPI JSON at `/docs/json`). Pictures are served from `/assets/...`, and image fields in responses hold those paths.

| Method       | Path                              |                                                                                               |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------------------- |
| GET          | `/site`                           | Shop details (address, hours, ship countries, next box cutoff)                                |
| GET          | `/wines?type=&growerId=`          | Wines, unlisted ones flagged with `unlisted: true`                                            |
| GET          | `/wines/:id`                      |                                                                                               |
| GET          | `/oils?growerId=`                 | Olive oils and tasting sets                                                                   |
| GET          | `/oils/:id`                       |                                                                                               |
| GET          | `/club-plans`                     |                                                                                               |
| GET          | `/growers`, `/growers/:id`        |                                                                                               |
| POST         | `/growers/:id/visits`             | `{ name, email, date, guests, notes? }`                                                       |
| GET          | `/articles`, `/articles/:slug`    | Journal (article bodies stay in the UI)                                                       |
| GET          | `/search?q=`                      | `{ wines, oils, growers }`                                                                    |
| GET          | `/quiz`                           | `{ questions, profiles }`                                                                     |
| POST         | `/quiz/recommendations`           | `{ answers: number[] }` → `{ top, profile, wines }`                                           |
| GET          | `/cart`                           | Priced cart: `{ id, lines, saved, promo, giftNote, totals }`                                  |
| GET          | `/cart/shipping-options`          | Standard, Saturday and pickup prices for this cart                                            |
| POST         | `/cart/lines`                     | `{ id, qty?, option? }`: option is a vintage year, oil size (`250`, `3000`) or club frequency |
| PATCH        | `/cart/lines/:key`                | `{ qty }`                                                                                     |
| DELETE       | `/cart/lines/:key`                |                                                                                               |
| POST         | `/cart/lines/:key/save-for-later` |                                                                                               |
| POST         | `/cart/saved/:key/move-to-cart`   |                                                                                               |
| DELETE       | `/cart/saved/:key`                |                                                                                               |
| PUT / DELETE | `/cart/promo`                     | `{ code }`, 422 if the code is unknown                                                        |
| PUT          | `/cart/gift-note`                 | `{ note }` (`null` clears it)                                                                 |
| DELETE       | `/cart`                           | Empties the cart, keeps saved items                                                           |
| POST         | `/orders`                         | `{ details, ship, address?, pay }` → `{ order, payment }` (see Payments)                      |
| GET          | `/orders/:id`                     | An order placed from this cart; re-checks a pending card payment                              |
| POST         | `/newsletter`                     | `{ email, source? }`                                                                          |

Content responses use the same shape as the UI's `src/data/` types (minus `path`, which the UI's `src/lib/` adds), so the access layer can swap its imports for fetches.

## Cart

The cart lives in the database. Its id is kept in an httpOnly `cart_id` cookie that the API sets on the first write, so the frontend must call it with `credentials: 'include'`. CORS allows the origins in `CORS_ORIGIN` (comma-separated) with credentials. In development, Vite on `localhost:5173` and the API on `localhost:3000` count as the same site, so the cookie works; in production, serve both from the same site (for example `/api` behind the same domain).

Every cart response is priced on the server with the shop rules from `src/modules/cart/pricing.ts`: −10% on 6+ wine bottles, promo codes from the `promo_codes` table applied to goods after that discount, free EU shipping from €120 of goods (otherwise €9.90), Club plans excluded from discounts and shipping, one Club plan per cart, at most 24 of a product. Line keys are `id` or `id@option`.

Orders re-price the cart in the same transaction, so clients can't change totals.

## Payments

`POST /orders` stores the order and answers with the order and what the customer should do next:

- **Card or Apple / Google Pay** (`pay: 'card' | 'wallet'`): the order is `pending_payment` and `payment` is `{ method: 'stripe', clientSecret }`. Mount Stripe's Payment Element with that secret and call `stripe.confirmPayment()`; it offers cards and wallets by itself. The cart stays as it is until payment succeeds, so a declined card loses nothing. When Stripe sends `payment_intent.succeeded` to the webhook, the API checks the amount, marks the order `paid`, empties the cart and sends the confirmation email. After `confirmPayment()` the frontend can call `GET /orders/:id`, which also asks Stripe directly in case the webhook hasn't arrived yet.
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
    api/<resource>/      site, wines, oils, club-plans, growers, articles, search, quiz, cart, orders, newsletter
    webhooks/stripe/     raw-body webhook endpoint
    health/
  controllers/         HTTP layer: read the request, call a service, shape the reply
  dto/                 Zod schemas per route: params, query, body, responses (also feed /docs)
  services/            use cases and business rules; take the database or Deps, know nothing about HTTP
  repositories/        Drizzle queries, one file per table or aggregate
  adapters/            outside services behind an interface: payments (Stripe, fake), email (Resend, log)
  plugins/             Fastify plugins: dependencies, error handler, CORS, cookies, static assets, Swagger
  lib/                 domain logic without I/O: pricing, cart options, search, quiz scoring, order view, email templates
  utils/               generic helpers: errors, money, HTML escaping, null stripping
  types/               domain, cart, order, dependency and Fastify types
  db/                  Drizzle schema, client, migration runner, seed (seed/data is the storefront content)
drizzle/               SQL migrations
public/assets/         pictures served at /assets
test/                  Vitest
```

To add an endpoint, add a schema to `dto/`, a function to `services/` (and to `repositories/` if it needs a new query), a handler to `controllers/`, then wire it in `routes/api/<resource>/index.ts`. Controllers are typed from the DTO with `Request<typeof schema>` and `Reply<typeof schema>` from `types/http.ts`.
