import type { recommendSchema } from '../dto/quiz.dto.ts'
import * as quiz from '../services/quiz.service.ts'
import type { Request } from '../types/http.ts'

export const getQuiz = (req: Request) => quiz.getQuiz(req.server.db)

export const recommend = (req: Request<typeof recommendSchema>) => quiz.recommendWines(req.server.db, req.body.answers)
