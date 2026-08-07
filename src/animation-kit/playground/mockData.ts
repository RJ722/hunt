import type { LetterStatus } from '../contract'
import curiousKat from '../../data/artifacts/curious-kat.svg?url'

export const mockAnswer = 'RELAY'

/** A spaced answer to exercise the fixed-gap rendering in the puzzle. */
export const mockSpacedAnswer = 'IN BLOOM'

/** Artifact image URL used by the playground wordle scene. */
export const mockArtifact = curiousKat

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
  "The first treat is found! Kat's whiskers twitch toward the quietest, coziest room in the house — where hundreds of stories nap on their shelves."

export const mockCompletion =
  'Every treat sniffed out, every riddle solved. Happy birthday, Kat — you clever, curious thing. 🎂🐾'
