import type { LetterStatus } from '../contract'

export const mockAnswer = 'RELAY'

/** A trivial local scorer so the playground needs no app dependencies. */
export function mockEvaluate(answer: string) {
  return (guess: string): LetterStatus[] => {
    const g = guess.toUpperCase()
    const a = answer.toUpperCase()
    const result: LetterStatus[] = new Array(g.length).fill('absent')
    const remaining: Record<string, number> = {}
    for (let i = 0; i < g.length; i++) {
      if (g[i] === a[i]) result[i] = 'correct'
      else remaining[a[i]] = (remaining[a[i]] ?? 0) + 1
    }
    for (let i = 0; i < g.length; i++) {
      if (result[i] === 'correct') continue
      if (remaining[g[i]] > 0) {
        result[i] = 'present'
        remaining[g[i]] -= 1
      }
    }
    return result
  }
}

export const mockClue =
  'Signal locked. Head to the quietest room in the building — where knowledge is stacked floor to ceiling.'

export const mockCompletion = 'ACCESS GRANTED. You cracked every cipher, Agent.'
