import { describe, expect, it } from 'vitest'
import { answersError, recommend } from '../src/lib/quizScoring.ts'
import type { Wine } from '../src/types/content.ts'
import { quiz, wines } from './fixtures.ts'

describe('recommend', () => {
  it('returns six listed, in-stock wines with at most two per style', () => {
    const { top, wines: six } = recommend(
      quiz,
      wines as Wine[],
      quiz.map(() => 0),
    )
    expect(top).toBe('Red')
    expect(six).toHaveLength(6)
    expect(six.every((w) => !w.unlisted && w.left !== 0)).toBe(true)
    const perType = Object.groupBy(six, (w) => w.type)
    expect(Object.values(perType).every((group) => (group?.length ?? 0) <= 2)).toBe(true)
  })
})

describe('answersError', () => {
  it('checks answer count and range', () => {
    expect(
      answersError(
        quiz,
        quiz.map(() => 0),
      ),
    ).toBeNull()
    expect(answersError(quiz, [0])).toMatch(/Expected/)
    expect(
      answersError(
        quiz,
        quiz.map(() => 9),
      ),
    ).toMatch(/out of range/)
  })
})
