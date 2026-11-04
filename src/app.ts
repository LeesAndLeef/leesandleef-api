import Fastify, { type FastifyServerOptions } from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { assets } from './plugins/assets.ts'
import { cookie } from './plugins/cookie.ts'
import { cors } from './plugins/cors.ts'
import { type DependenciesOptions, dependencies } from './plugins/dependencies.ts'
import { errorHandler } from './plugins/errorHandler.ts'
import { swagger } from './plugins/swagger.ts'
import { routes } from './routes/index.ts'

export interface AppOptions extends DependenciesOptions {
  corsOrigin: string[]
  logger?: FastifyServerOptions['logger']
}

export async function buildApp({ corsOrigin, logger = false, ...deps }: AppOptions) {
  const app = Fastify({ logger }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(dependencies, deps)
  await app.register(errorHandler)
  await app.register(cors, { origin: corsOrigin })
  await app.register(cookie)
  await app.register(assets)
  await app.register(swagger)
  await app.register(routes)

  return app
}
