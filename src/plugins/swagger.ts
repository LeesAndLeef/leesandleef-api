import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

export const swagger = fp(
  async (app) => {
    await app.register(fastifySwagger, {
      openapi: { info: { title: 'Lees & Leaf API', version: '1.0.0' } },
      transform: jsonSchemaTransform,
    })
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' })
  },
  { name: 'swagger' },
)
