# Lees & Leaf API

Backend for the Lees & Leaf storefront (`../leesandleef-ui`), a natural wine and olive oil shop. It serves the catalog, keeps carts and prices them on the server, takes orders and payments (Stripe or bank transfer), and sends order emails.

- Fastify 5, Zod 4 (`fastify-type-provider-zod`), PostgreSQL with Drizzle ORM, Stripe, Resend, TypeScript run by tsx, yarn 4 (`nodeLinker: node-modules`), Vitest, Biome.
- ESM with `.ts` extensions in relative imports (`rewriteRelativeImportExtensions`). Use `import type` for types.

## Commands

```sh
yarn dev           # watch mode on :3000, docs at /docs
yarn typecheck
yarn test          # the checkout test also runs against the database when DATABASE_URL is set
yarn check         # Biome, read-only
yarn check:fix     # Biome: format, sort imports, remove unused imports
yarn build         # tsc to dist/
yarn db:generate   # migration from src/db/schema.ts changes
yarn db:migrate
yarn db:seed       # deletes and reloads all catalog content
```

Run `yarn check`, `yarn typecheck`, `yarn test` and `yarn build` before calling a change done.

## Architecture

A request goes route → controller → service → repository. Each layer only calls the one below it.

- `routes/` mirrors the URL tree: `routes/api/<resource>/index.ts` maps methods and paths to controllers, with the schema from `dto/`. Register new resources in `routes/index.ts`. Everything public sits under `/api/v1`; `/health` and `/webhooks/stripe` stay unversioned.
- `controllers/` holds thin handlers typed from their DTO with `Request<typeof schema>` and `Reply<typeof schema>` from `types/http.ts`. They read the request, call one service and shape the reply. No queries and no business rules here.
- `dto/` holds one `<name>.dto.ts` per area: Zod schemas for params, query, body and responses, exported as route schemas (`getWineSchema`, …) with `satisfies FastifySchema`. They also generate the OpenAPI docs, so give each route a `tags` entry and a `summary` when it isn't obvious.
- `services/` holds use cases and business rules. They take `db` (or a transaction) or `Deps` from `types/deps.ts` when they need payments, mail, config or the logger. They never touch Fastify requests or replies. Wrap multi-step writes in `db.transaction`.
- `repositories/` holds Drizzle queries only, one file per table or aggregate, and returns domain objects through the mappers in `lib/mappers.ts`. Functions accept `DbOrTx` so services can pass a transaction.
- `adapters/` puts outside services behind an interface (`PaymentProvider`, `Mailer`), with a real and a local implementation each. `server.ts` picks them from env, `buildApp()` takes them as options, and tests pass stubs. Never import the Stripe SDK or call Resend outside `adapters/`.
- `plugins/` holds Fastify plugins. App-wide ones are wrapped in `fastify-plugin`.
- `lib/` holds domain logic without I/O (pricing, cart options, search, quiz scoring, order view, email templates). The one exception is `cartSession.ts`, the cart cookie helper the controllers share.
- `utils/` holds generic helpers: `HttpError` and `notFound`/`unprocessable`/`conflict`, money, HTML escaping, `compact`.
- `config/` holds `env.ts` (Zod-validated; add every new variable there and to `.env.example`) and `constants.ts` (shop rules and enums in UPPER_SNAKE_CASE).
- `types/` holds shared types: `content.ts` (catalog shapes), `cart.ts`, `order.ts`, `deps.ts`, `http.ts`, `fastify.d.ts`.

File names carry their layer: `cart.controller.ts`, `cart.service.ts`, `cart.repository.ts`, `cart.dto.ts`, `stripe.adapter.ts`.

## Conventions

- Match the surrounding code. No comments: make code clear through naming and small functions.
- Signal errors by throwing `HttpError` or its helpers from `utils/errors.ts`. The error handler turns them into `{ statusCode, error, message }` and hides 5xx details. Use 400 for invalid input (Zod does this), 404 when something doesn't exist, 409 for a conflict such as an empty cart, 422 when the input is valid but breaks a rule, 502 when a provider fails.
- Catalog responses have the same shape as the UI's `src/data/` types (no `path`; the UI adds it), so the frontend can swap imports for fetches. Don't rename fields without changing the UI too.
- Money is euros as `number`, rounded with `roundMoney()`. Stripe gets cents through `toCents()`. Format with `formatMoney()`.
- Pricing rules live in `config/constants.ts` and `lib/pricing.ts` and must match the UI's `src/lib/pricing.ts`: −10% on 6+ wine bottles, promo codes from the `promo_codes` table on goods after that discount, free shipping from €120 of goods (otherwise €9.90), Club plans excluded from discounts and shipping, one Club plan per cart, at most 24 of a product.
- Never trust client totals: orders re-price the cart on the server. Card orders stay `pending_payment` and keep the cart until the Stripe webhook (or `GET /orders/:id`) confirms the amount. Webhook handling must be idempotent. Orders are only readable from the cart that placed them.

## Database

- Change `src/db/schema.ts`, run `yarn db:generate --name=<what_changed>`, and read the SQL before applying it. Drizzle's enum changes and new NOT NULL columns usually need hand edits for existing rows.
- Never edit a migration that has been applied anywhere; add a new one.
- `yarn db:seed` replaces all catalog content from `src/db/seed/data/` (ported from the UI's `src/data/`, with pictures as `/assets/...` paths). Never run it against production once content is edited there.

## Tests

- Put pure logic tests next to the others in `test/`, with fixtures from the seed data (`test/fixtures.ts`).
- Integration tests go through `buildApp()` and `app.inject()` with stub adapters. Skip them when `DATABASE_URL` is missing, and delete every row they create.

## Git

- Always ask before creating a branch or a commit: propose the branch name and the exact message, and run it only after approval. Approval for one commit doesn't carry over to the next.
- Commits are signed: `git commit -S -m "<message>"`.
- Messages follow Conventional Commits: `type(scope): description`, with types such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`.
- Branch from `main`; name branches in snake_case after the change (`add_stock_tracking`).
- Subagents never commit, push, branch, stash or reset; they leave changes uncommitted for review.

## General rules

- Don't add dependencies without asking.
- Never commit `.env` or real keys. Stripe and Resend keys only come from env.
- Don't touch applied migrations in `drizzle/`, `public/assets/`, the lockfile or editor settings unless the task is about them.
