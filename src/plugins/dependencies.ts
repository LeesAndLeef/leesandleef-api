import fp from 'fastify-plugin'
import { createLogMailer } from '../adapters/email/log.adapter.ts'
import type { Mailer } from '../adapters/email/mailer.adapter.ts'
import { createFakePayments } from '../adapters/payments/fake.adapter.ts'
import type { PaymentProvider } from '../adapters/payments/payment.adapter.ts'
import type { Db } from '../db/client.ts'
import type { AppConfig } from '../types/deps.ts'

export interface DependenciesOptions {
  db: Db
  config: AppConfig
  payments?: PaymentProvider
  mailer?: Mailer
}

export const dependencies = fp<DependenciesOptions>(
  async (app, { db, config, payments, mailer }) => {
    app.decorate('db', db)
    app.decorate('config', config)
    app.decorate('payments', payments ?? createFakePayments())
    app.decorate('mailer', mailer ?? createLogMailer(app.log))
    if (!payments) app.log.warn('No STRIPE_SECRET_KEY: card payments are faked and succeed immediately')
  },
  { name: 'dependencies' },
)
