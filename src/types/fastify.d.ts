import 'fastify'
import type { Mailer } from '../adapters/email/mailer.adapter.ts'
import type { PaymentProvider } from '../adapters/payments/payment.adapter.ts'
import type { Db } from '../db/client.ts'
import type { AppConfig } from './deps.ts'

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
    payments: PaymentProvider
    mailer: Mailer
    config: AppConfig
  }
}
