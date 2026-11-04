import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import * as auth from '../../../controllers/auth.controller.ts'
import { loginSchema, logoutSchema, signupSchema } from '../../../dto/auth.dto.ts'

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/signup', { schema: signupSchema }, auth.signup)
  app.post('/login', { schema: loginSchema }, auth.login)
  app.post('/logout', { schema: logoutSchema }, auth.logout)
}
