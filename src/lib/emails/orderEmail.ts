import type { Mail } from '../../adapters/email/mailer.adapter.ts'
import type { Site } from '../../types/content.ts'
import type { BankDetails } from '../../types/deps.ts'
import { escapeHtml } from '../../utils/html.ts'
import { formatMoney } from '../../utils/money.ts'
import type { OrderView } from '../orderView.ts'

interface OrderEmailInput {
  order: OrderView
  site: Pick<Site, 'street' | 'city' | 'email'>
  bank?: BankDetails
}

const STYLE = {
  body: 'font-family:Georgia,serif;color:#2b211c;background:#f6f1e8;padding:32px',
  card: 'max-width:560px;margin:0 auto;background:#fffdf8;padding:32px;border:1px solid #e5dccd',
  cell: 'padding:8px 0;border-bottom:1px solid #eee5d6;vertical-align:top',
  right: 'padding:8px 0;border-bottom:1px solid #eee5d6;text-align:right;white-space:nowrap',
  muted: 'color:#7a6b5d;font-size:13px',
  box: 'background:#f6f1e8;padding:16px;margin:24px 0',
}

function summaryRows(order: OrderView): [string, number][] {
  const { totals } = order
  return [
    ['Subtotal', totals.subtotal],
    ...(totals.mixDiscount ? [['Mixed six −10%', -totals.mixDiscount] as [string, number]] : []),
    ...(totals.promoDiscount ? [[`Promo ${order.promo ?? ''}`.trim(), -totals.promoDiscount] as [string, number]] : []),
    ['Delivery', totals.shipping],
    ['Total', totals.total],
  ]
}

function bankLines(bank: BankDetails, order: OrderView): [string, string][] {
  return [
    ['Beneficiary', bank.beneficiary],
    ['IBAN', bank.iban],
    ...(bank.bic ? [['BIC', bank.bic] as [string, string]] : []),
    ['Reference', order.number],
    ['Amount', formatMoney(order.total)],
  ]
}

export function orderEmail({ order, site, bank }: OrderEmailInput): Mail {
  const awaitingTransfer = order.status === 'awaiting_transfer' && bank !== undefined
  const subject = awaitingTransfer
    ? `Order ${order.number}: bank transfer details`
    : `Your Lees & Leaf order ${order.number}`
  const intro = awaitingTransfer
    ? 'Thank you for your order. We’ll pack it as soon as your transfer arrives — please use the order number as the reference.'
    : 'Thank you for your order. It’s paid and we’ll pack it for the next release.'
  const footer = `Lees & Leaf · ${site.street}, ${site.city} · ${site.email}`
  const totals = summaryRows(order)

  const text = [
    `Hi ${order.firstName},`,
    '',
    intro,
    '',
    `Order ${order.number}`,
    ...order.lines.map((l) => `${l.qty} × ${l.name} (${l.meta})  ${formatMoney(l.total)}`),
    '',
    ...totals.map(([label, amount]) => `${label}: ${formatMoney(amount)}`),
    '',
    `${order.shipName}: ${order.shipTo}`,
    `Payment: ${order.payName}`,
    ...(order.giftNote ? [`Gift note: ${order.giftNote}`] : []),
    ...(awaitingTransfer ? ['', 'Bank transfer', ...bankLines(bank, order).map(([k, v]) => `${k}: ${v}`)] : []),
    '',
    footer,
  ].join('\n')

  const e = escapeHtml
  const html = `<!doctype html>
<html><body style="${STYLE.body}"><div style="${STYLE.card}">
<h1 style="font-weight:normal;margin:0 0 8px">Lees &amp; Leaf</h1>
<p>Hi ${e(order.firstName)},</p>
<p>${e(intro)}</p>
<p style="${STYLE.muted}">Order ${e(order.number)}</p>
<table style="width:100%;border-collapse:collapse">
${order.lines
  .map(
    (l) =>
      `<tr><td style="${STYLE.cell}">${l.qty} × ${e(l.name)}<br><span style="${STYLE.muted}">${e(l.meta)}</span></td><td style="${STYLE.right}">${e(formatMoney(l.total))}</td></tr>`,
  )
  .join('\n')}
${totals
  .map(
    ([label, amount], i) =>
      `<tr><td style="${STYLE.cell}">${i === totals.length - 1 ? `<strong>${e(label)}</strong>` : e(label)}</td><td style="${STYLE.right}">${e(formatMoney(amount))}</td></tr>`,
  )
  .join('\n')}
</table>
${
  awaitingTransfer
    ? `<div style="${STYLE.box}"><strong>Bank transfer</strong><br>${bankLines(bank, order)
        .map(([k, v]) => `${e(k)}: ${e(v)}`)
        .join('<br>')}</div>`
    : ''
}
<p><strong>${e(order.shipName)}</strong><br>${e(order.shipTo)}</p>
<p>Payment: ${e(order.payName)}</p>
${order.giftNote ? `<p>Gift note: <em>${e(order.giftNote)}</em></p>` : ''}
<p style="${STYLE.muted}">${e(footer)}</p>
</div></body></html>`

  return { to: order.email, subject, html, text }
}
