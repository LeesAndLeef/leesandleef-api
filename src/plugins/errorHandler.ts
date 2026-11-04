import { STATUS_CODES } from 'node:http'
import type { FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

export const errorHandler = fp(
  async (app) => {
    app.setErrorHandler((error: FastifyError, req, reply) => {
      if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Request validation failed',
          issues: error.validation.map(({ instancePath, message }) => ({ path: instancePath, message })),
        })
      }
      const statusCode = typeof error.statusCode === 'number' && error.statusCode >= 400 ? error.statusCode : 500
      if (statusCode >= 500) req.log.error(error)
      return reply.code(statusCode).send({
        statusCode,
        error: STATUS_CODES[statusCode] ?? 'Error',
        message: statusCode >= 500 ? 'Something went wrong' : error.message,
      })
    })
  },
  { name: 'error-handler' },
)
