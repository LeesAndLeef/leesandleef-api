import type { FastifySchema } from 'fastify'
import { z } from 'zod'
import { PASSWORD_MIN_LENGTH } from '../config/constants.ts'
import { accountSchema, phone, text } from './account.dto.ts'

const email = z.email().max(254)
const tags = ['auth']

export const signupSchema = {
  tags,
  summary: 'Create an account and log in (sets the session cookie). 409 if the email is taken',
  body: z.object({
    email,
    password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
    firstName: text(),
    lastName: text(),
    phone: phone.optional(),
  }),
  response: { 201: accountSchema },
} satisfies FastifySchema

export const loginSchema = {
  tags,
  summary: 'Log in (sets the session cookie). 401 if the email or password is wrong',
  body: z.object({ email, password: z.string().min(1).max(200) }),
  response: { 200: accountSchema },
} satisfies FastifySchema

export const logoutSchema = {
  tags,
  summary: 'Log out (clears the session cookie)',
  response: { 204: z.null() },
} satisfies FastifySchema
