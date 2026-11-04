import { createResendMailer } from './adapters/email/resend.adapter.ts'
import { createStripePayments } from './adapters/payments/stripe.adapter.ts'
import { buildApp } from './app.ts'
import { env } from './config/env.ts'
import { createDb } from './db/client.ts'

const { db, pool } = createDb(env.DATABASE_URL)
const app = await buildApp({
  db,
  corsOrigin: env.CORS_ORIGIN,
  config: {
    secureCookies: env.NODE_ENV === 'production',
    bank:
      env.BANK_IBAN && env.BANK_BENEFICIARY
        ? { beneficiary: env.BANK_BENEFICIARY, iban: env.BANK_IBAN, ...(env.BANK_BIC && { bic: env.BANK_BIC }) }
        : null,
  },
  payments:
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
      ? createStripePayments({ secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET })
      : undefined,
  mailer: env.RESEND_API_KEY
    ? createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, replyTo: env.EMAIL_REPLY_TO })
    : undefined,
  logger: env.NODE_ENV === 'development' ? { level: 'info' } : true,
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close()
    await pool.end()
    process.exit(0)
  })
}

await app.listen({ host: env.HOST, port: env.PORT })
