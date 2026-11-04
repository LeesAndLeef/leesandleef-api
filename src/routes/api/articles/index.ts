import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as catalog from '../../../controllers/catalog.controller.ts'
import { getArticleSchema, listArticlesSchema } from '../../../dto/catalog.dto.ts'

export const articleRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: listArticlesSchema }, catalog.listArticles)
  app.get('/:slug', { schema: getArticleSchema }, catalog.getArticle)
}
