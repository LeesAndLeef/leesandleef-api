import type { FastifyBaseLogger } from 'fastify'
import type { Mailer } from '../adapters/email/mailer.adapter.ts'
import type { PaymentProvider } from '../adapters/payments/payment.adapter.ts'
import type { Db } from '../db/client.ts'

export interface BankDetails {
  beneficiary: string
  iban: string
  bic?: string
}

export interface AppConfig {
  secureCookies: boolean
  jwtSecret: string
  cookieSecret: string
  bank: BankDetails | null
}

export interface Deps {
  db: Db
  payments: PaymentProvider
  mailer: Mailer
  config: AppConfig
  log: FastifyBaseLogger
}
