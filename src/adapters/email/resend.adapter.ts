import type { Mail, Mailer } from './mailer.adapter.ts'

const RESEND_URL = 'https://api.resend.com/emails'

export function createResendMailer({
  apiKey,
  from,
  replyTo,
}: {
  apiKey: string
  from: string
  replyTo?: string
}): Mailer {
  return {
    async send(mail: Mail) {
      const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [mail.to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          reply_to: replyTo,
        }),
      })
      if (!response.ok) throw new Error(`Resend responded ${response.status}: ${await response.text()}`)
    },
  }
}
