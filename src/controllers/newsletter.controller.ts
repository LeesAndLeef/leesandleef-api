import type { subscribeSchema } from '../dto/newsletter.dto.ts'
import { subscribe as addSubscriber } from '../services/newsletter.service.ts'
import type { Reply, Request } from '../types/http.ts'

export async function subscribe(req: Request<typeof subscribeSchema>, reply: Reply<typeof subscribeSchema>) {
  await addSubscriber(req.server.db, req.body.email, req.body.source)
  return reply.code(201).send({ subscribed: true })
}
