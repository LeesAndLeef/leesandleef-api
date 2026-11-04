import type { searchSchema } from '../dto/search.dto.ts'
import { searchCatalog } from '../services/search.service.ts'
import type { Request } from '../types/http.ts'

export const search = (req: Request<typeof searchSchema>) => searchCatalog(req.server.db, req.query.q)
