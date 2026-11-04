import { QUIZ_MAX_PER_STYLE, QUIZ_MIX_SIZE, WINE_FILTER_TYPES } from '../config/constants.ts'
import type { QuizQuestion, Wine, WineFilterType } from '../types/content.ts'

export function answersError(questions: QuizQuestion[], answers: number[]): string | null {
  if (answers.length !== questions.length) return `Expected ${questions.length} answers, got ${answers.length}`
  const bad = answers.findIndex((a, i) => a >= (questions[i]?.answers.length ?? 0))
  return bad === -1 ? null : `Answer ${answers[bad]} is out of range for question ${bad + 1}`
}

export function recommend(questions: QuizQuestion[], wines: Wine[], answers: number[]) {
  const styleScores = Object.fromEntries(WINE_FILTER_TYPES.map((type) => [type, 0])) as Record<WineFilterType, number>
  let bold = 0
  answers.forEach((a, i) => {
    const answer = questions[i]?.answers[a]
    if (!answer) return
    for (const [type, n] of Object.entries(answer.styles)) styleScores[type as WineFilterType] += n
    bold += answer.bold ?? 0
  })

  const score = (w: Wine) => (styleScores[w.type as WineFilterType] ?? 0) * 3 + bold * (parseFloat(w.abv) - 12.5)
  const ranked = wines.filter((w) => !w.unlisted && w.left !== 0).sort((a, b) => score(b) - score(a))

  const six: Wine[] = []
  for (const w of ranked) {
    if (six.filter((x) => x.type === w.type).length < QUIZ_MAX_PER_STYLE) six.push(w)
    if (six.length === QUIZ_MIX_SIZE) break
  }
  const top = WINE_FILTER_TYPES.reduce((a, b) => (styleScores[b] > styleScores[a] ? b : a))
  return { top, wines: six }
}
