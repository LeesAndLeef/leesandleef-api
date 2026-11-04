import type { FastifyBaseLogger } from 'fastify'
import type { Mail, Mailer } from './mailer.adapter.ts'

export function createLogMailer(log: Pick<FastifyBaseLogger, 'info'>): Mailer {
  return {
    async send(mail: Mail) {
      log.info({ to: mail.to, subject: mail.subject }, `Email not sent (no RESEND_API_KEY):\n${mail.text}`)
    },
  }
}
