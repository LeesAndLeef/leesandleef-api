import type { requestVisitSchema } from '../dto/visit.dto.ts'
import { requestVisit as request } from '../services/visit.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function requestVisit(req: Request<typeof requestVisitSchema>, reply: Reply<typeof requestVisitSchema>) {
  return reply.code(201).send(await request(req.server.db, req.params.id, req.body))
}
