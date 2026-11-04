import { z } from 'zod'

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.url(),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:5173')
      .transform((value) => value.split(',').map((origin) => origin.trim())),
    JWT_SECRET: z.string().min(32),
    COOKIE_SECRET: z.string().min(32),
    STRIPE_SECRET_KEY: optional(z.string().startsWith('sk_')),
    STRIPE_WEBHOOK_SECRET: optional(z.string().startsWith('whsec_')),
    RESEND_API_KEY: optional(z.string().startsWith('re_')),
    EMAIL_FROM: z.string().default('Lees & Leaf <orders@leesandleaf.test>'),
    EMAIL_REPLY_TO: optional(z.email()),
    BANK_BENEFICIARY: optional(z.string()),
    BANK_IBAN: optional(z.string()),
    BANK_BIC: optional(z.string()),
  })
  .superRefine((env, ctx) => {
    const require = (key: keyof typeof env, reason: string) => {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required ${reason}` })
    }
    if (env.STRIPE_SECRET_KEY) require('STRIPE_WEBHOOK_SECRET', 'when STRIPE_SECRET_KEY is set')
    if (env.BANK_IBAN) require('BANK_BENEFICIARY', 'when BANK_IBAN is set')
    if (env.NODE_ENV === 'production') {
      require('STRIPE_SECRET_KEY', 'in production')
      require('RESEND_API_KEY', 'in production')
    }
  })

export const env = schema.parse(process.env)

export type Env = typeof env
