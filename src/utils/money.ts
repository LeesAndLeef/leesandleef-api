import { CURRENCY, LOCALE } from '../config/constants.ts'

export const roundMoney = (amount: number) => Math.round(amount * 100) / 100

export const toCents = (amount: number) => Math.round(amount * 100)

const formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })

export const formatMoney = (amount: number) => formatter.format(amount)
