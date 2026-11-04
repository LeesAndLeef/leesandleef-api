import { randomBytes } from 'node:crypto'
import { ORDER_NUMBER_PREFIX } from '../config/constants.ts'

export const newOrderNumber = (now = Date.now()) =>
  `${ORDER_NUMBER_PREFIX}${now.toString(36)}${randomBytes(2).toString('hex')}`.toUpperCase()
