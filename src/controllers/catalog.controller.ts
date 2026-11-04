import type {
  getArticleSchema,
  getGrowerSchema,
  getOilSchema,
  getWineSchema,
  listOilsSchema,
  listWinesSchema,
} from '../dto/catalog.dto.ts'
import * as catalog from '../services/catalog.service.ts'
import type { Request } from '../types/http.ts'

export const getSite = (req: Request) => catalog.getSite(req.server.db)

export const listWines = (req: Request<typeof listWinesSchema>) => catalog.listWines(req.server.db, req.query)

export const getWine = (req: Request<typeof getWineSchema>) => catalog.getWine(req.server.db, req.params.id)

export const listOils = (req: Request<typeof listOilsSchema>) => catalog.listOils(req.server.db, req.query)

export const getOil = (req: Request<typeof getOilSchema>) => catalog.getOil(req.server.db, req.params.id)

export const listClubPlans = (req: Request) => catalog.listClubPlans(req.server.db)

export const listGrowers = (req: Request) => catalog.listGrowers(req.server.db)

export const getGrower = (req: Request<typeof getGrowerSchema>) => catalog.getGrower(req.server.db, req.params.id)

export const listArticles = (req: Request) => catalog.listArticles(req.server.db)

export const getArticle = (req: Request<typeof getArticleSchema>) => catalog.getArticle(req.server.db, req.params.slug)
