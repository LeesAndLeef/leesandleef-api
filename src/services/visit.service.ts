import type { DbOrTx } from '../db/client.ts'
import { findGrower } from '../repositories/grower.repository.ts'
import { insertVisitRequest } from '../repositories/visit.repository.ts'
import { notFound, unprocessable } from '../utils/errors.ts'

export interface VisitRequestInput {
  name: string
  email: string
  date: string
  guests: number
  notes?: string
}

const today = () => new Date().toISOString().slice(0, 10)

export async function requestVisit(db: DbOrTx, growerId: string, input: VisitRequestInput) {
  const grower = await findGrower(db, growerId)
  if (!grower) throw notFound(`Grower ${growerId} not found`)
  const visit = grower.profile?.visit
  if (!visit) throw unprocessable(`${grower.name} doesn’t take visits`)
  if (input.date < today()) throw unprocessable('Pick a date from today onwards')

  const request = await insertVisitRequest(db, {
    growerId: grower.id,
    ...input,
    email: input.email.toLowerCase(),
    notes: input.notes || null,
  })
  return { id: request.id, host: visit.host, date: request.date }
}
