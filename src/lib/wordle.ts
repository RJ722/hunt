export type LetterStatus = 'correct' | 'present' | 'absent'

/**
 * Score a guess against the answer using classic Wordle rules.
 *
 * Two-pass algorithm so duplicate letters are handled correctly:
 *  1. Mark exact-position matches as "correct" and consume them from a
 *     remaining-letter tally.
 *  2. For the rest, mark "present" only while unconsumed copies of that letter
 *     remain in the answer, otherwise "absent".
 *
 * Both inputs are uppercased first so casing never matters. Callers guarantee
 * equal length (the letter-wheel UI always produces a full-length guess), but
 * if lengths differ we still return a status array the length of the guess.
 */
export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const g = guess.toUpperCase()
  const a = answer.toUpperCase()

  const result: LetterStatus[] = new Array(g.length).fill('absent')
  const remaining: Record<string, number> = {}

  // Pass 1: exact matches.
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct'
    } else {
      const c = a[i]
      if (c !== undefined) remaining[c] = (remaining[c] ?? 0) + 1
    }
  }

  // Pass 2: present-but-misplaced.
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue
    const c = g[i]
    if (remaining[c] > 0) {
      result[i] = 'present'
      remaining[c] -= 1
    }
  }

  return result
}

/** True when every letter is in its correct position. */
export function isSolved(statuses: LetterStatus[]): boolean {
  return statuses.length > 0 && statuses.every((s) => s === 'correct')
}
