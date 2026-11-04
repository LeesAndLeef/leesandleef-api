import type { DbOrTx } from '../db/client.ts'
import { answersError, recommend } from '../lib/quizScoring.ts'
import { findQuiz } from '../repositories/quiz.repository.ts'
import { findWines } from '../repositories/wine.repository.ts'
import { unprocessable } from '../utils/errors.ts'

export const getQuiz = (db: DbOrTx) => findQuiz(db)

export async function recommendWines(db: DbOrTx, answers: number[]) {
  const [{ questions, profiles }, wines] = await Promise.all([findQuiz(db), findWines(db)])
  const error = answersError(questions, answers)
  if (error) throw unprocessable(error)
  const { top, wines: six } = recommend(questions, wines, answers)
  const profile = profiles[top]
  if (!profile) throw new Error(`Quiz profile ${top} is missing: run yarn db:seed`)
  return { top, profile, wines: six }
}
