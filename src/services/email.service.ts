import { orderEmail } from '../lib/emails/orderEmail.ts'
import { claimConfirmation, releaseConfirmation } from '../repositories/order.repository.ts'
import { findSite } from '../repositories/site.repository.ts'
import type { Deps } from '../types/deps.ts'
import { loadOrderView } from './orderView.service.ts'

export async function sendOrderConfirmation(deps: Deps, orderId: string) {
  if (!(await claimConfirmation(deps.db, orderId))) return
  try {
    const [order, site] = await Promise.all([loadOrderView(deps.db, orderId), findSite(deps.db)])
    await deps.mailer.send(orderEmail({ order, site, bank: deps.config.bank ?? undefined }))
  } catch (error) {
    await releaseConfirmation(deps.db, orderId)
    deps.log.error({ err: error, orderId }, 'Order confirmation email failed')
  }
}
