import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'
import { SESSION_COOKIE } from '../config/constants.ts'

export const swagger = fp(
  async (app) => {
    await app.register(fastifySwagger, {
      openapi: {
        info: { title: 'Lees & Leaf API', version: '1.0.0' },
        components: {
          securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE } },
        },
      },
      transform: jsonSchemaTransform,
    })
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' })
  },
  { name: 'swagger' },
)
