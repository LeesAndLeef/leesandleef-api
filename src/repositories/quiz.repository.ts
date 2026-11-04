import { asc } from 'drizzle-orm'
import type { DbOrTx } from '../db/client.ts'
import * as t from '../db/schema.ts'
import type { QuizProfile, WineFilterType } from '../types/content.ts'

export async function findQuiz(db: DbOrTx) {
  const [questions, profiles] = await Promise.all([
    db.select().from(t.quizQuestions).orderBy(asc(t.quizQuestions.position)),
    db.select().from(t.quizProfiles),
  ])
  return {
    questions: questions.map(({ q, answers }) => ({ q, answers })),
    profiles: Object.fromEntries(profiles.map(({ style, title, text }) => [style, { title, text }])) as Partial<
      Record<WineFilterType, QuizProfile>
    >,
  }
}
