import type { FastifyPluginAsync } from 'fastify'
import { accountRoutes } from './api/account/index.ts'
import { articleRoutes } from './api/articles/index.ts'
import { authRoutes } from './api/auth/index.ts'
import { cartRoutes } from './api/cart/index.ts'
import { clubPlanRoutes } from './api/club-plans/index.ts'
import { growerRoutes } from './api/growers/index.ts'
import { newsletterRoutes } from './api/newsletter/index.ts'
import { oilRoutes } from './api/oils/index.ts'
import { orderRoutes } from './api/orders/index.ts'
import { quizRoutes } from './api/quiz/index.ts'
import { searchRoutes } from './api/search/index.ts'
import { siteRoutes } from './api/site/index.ts'
import { wineRoutes } from './api/wines/index.ts'
import { healthRoutes } from './health/index.ts'
import { stripeWebhookRoutes } from './webhooks/stripe/index.ts'

export const API_PREFIX = '/api/v1'

const apiRoutes: [string, FastifyPluginAsync][] = [
  ['/site', siteRoutes],
  ['/wines', wineRoutes],
  ['/oils', oilRoutes],
  ['/club-plans', clubPlanRoutes],
  ['/growers', growerRoutes],
  ['/articles', articleRoutes],
  ['/search', searchRoutes],
  ['/quiz', quizRoutes],
  ['/cart', cartRoutes],
  ['/auth', authRoutes],
  ['/account', accountRoutes],
  ['/orders', orderRoutes],
  ['/newsletter', newsletterRoutes],
]

export const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(stripeWebhookRoutes, { prefix: '/webhooks/stripe' })
  for (const [prefix, plugin] of apiRoutes) await app.register(plugin, { prefix: `${API_PREFIX}${prefix}` })
}
