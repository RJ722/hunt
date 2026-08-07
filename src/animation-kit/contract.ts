/**
 * ANIMATION-KIT CONTRACT
 * ----------------------
 * This file is the ONLY shared boundary between the functional app (outside
 * this folder) and the design/animation work (inside `animation-kit/`).
 *
 * The functional app imports these components by these prop types and nothing
 * else. A separate design agent may freely rewrite the animation components'
 * internals as long as they keep honoring these interfaces. Changing anything
 * here requires coordination between both workstreams.
 */

export type LetterStatus = 'correct' | 'present' | 'absent'

/**
 * The Wordle-style guessing gate shown when a non-final tag is tapped.
 *
 * Renders `answerLength` letter wheels (A–Z). The player spins each wheel and
 * submits a guess; the component scores it via the injected `evaluateGuess`.
 * After `maxAttempts` failed guesses it reveals `answer` so nobody gets stuck.
 */
export interface WordleGuessGameProps {
  /** Number of letter wheels to render (== answer.length). */
  answerLength: number
  /** The target word (A–Z uppercase). Used for reveal-after-exhaustion. */
  answer: string
  /** Optional theme/hint text to display with the puzzle. */
  hint?: string
  /**
   * Optional artifact image (e.g. an animated character) shown with the
   * puzzle. Any positions in `answer` that are spaces are rendered as fixed
   * gaps — the player never guesses them.
   */
  artifactSrc?: string
  /** Alt text for the artifact image. */
  artifactAlt?: string
  /** Maximum guesses before the answer is revealed (e.g. 6). */
  maxAttempts: number
  /** Pure scorer, pre-bound to this riddle's answer. */
  evaluateGuess: (guess: string) => LetterStatus[]
  /**
   * Called once the gate is cleared.
   * @param solved true = guessed correctly; false = revealed after running out
   *               of attempts. Lets the design differentiate a triumphant
   *               flourish from a consolation reveal.
   */
  onResolved: (solved: boolean) => void
}

/**
 * The clue-reveal animation, shown after the Wordle gate is cleared. It is the
 * riddle screen itself — it owns how/when the clue text appears.
 */
export interface TagRiddleAnimationProps {
  /** Optional riddle title. */
  riddleTitle?: string
  /** The clue guiding the player to the next physical tag. */
  riddleText: string
}

/** The celebratory animation shown when the final tag is tapped. */
export interface CompletionAnimationProps {
  /** Customizable congratulatory message (from tags.ts completionMessage). */
  message: string
}
