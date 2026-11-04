import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as quiz from '../../../controllers/quiz.controller.ts'
import { getQuizSchema, recommendSchema } from '../../../dto/quiz.dto.ts'

export const quizRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', { schema: getQuizSchema }, quiz.getQuiz)
  app.post('/recommendations', { schema: recommendSchema }, quiz.recommend)
}
