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
   * Optional deeper hint, surfaced only once the player is visibly stuck —
   * after their 3rd failed attempt (`attemptsUsed >= 3`). Absent = no extra
   * hint appears at that point.
   */
  hint2?: string
  /**
   * Optional strongest hint, surfaced right before the player's very last
   * attempt (`attemptsUsed === maxAttempts - 1`), i.e. one attempt before the
   * answer would otherwise be auto-revealed. Absent = no extra hint appears.
   */
  hint3?: string
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
  /**
   * When true, a small dismissible tip ("drag a letter to change it") appears
   * after 20s of no spinning at all. Intended for only the very first riddle
   * of the hunt — every wheel already auto-spins on mount regardless of this
   * flag, but by the second stop the player has surely spun something
   * themselves already, so later riddles should pass `false` to skip the tip.
   */
  showOnboarding?: boolean
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
  /**
   * Optional hero image shown above the clue text — this is the very same
   * sprite2 frame `SolveTransition` lands on, so the clue page shows the
   * "landed" sprite in place, not a separate flower/ribbon graphic.
   */
  heroSrc?: string
  /** Alt text for the hero image. */
  heroAlt?: string
  /**
   * When true, renders already fully "bloomed" with no entrance animation —
   * used when this exact content was just shown moments earlier (e.g. on the
   * back face of `SolveTransition`) so it doesn't visibly replay from
   * scratch. Independent of the user's reduced-motion preference.
   */
  instant?: boolean
}

/** The celebratory animation shown when the final tag is tapped. */
export interface CompletionAnimationProps {
  /** Customizable congratulatory message (from tags.ts completionMessage). */
  message: string
}

/**
 * The "you got it!" payoff played once between a solved Wordle gate and the
 * clue reveal. Owns its own timing end-to-end and calls `onComplete` when the
 * sequence (or its reduced-motion equivalent) is finished, at which point the
 * caller should swap in the plain `TagRiddleAnimation` for the persistent view.
 */
export interface SolveTransitionProps {
  /** Same artifact shown in the Wordle gate — the sprite that spins & grows. */
  artifactSrc?: string
  /**
   * Optional second sprite frame. Swapped in for the final half-turn as the
   * spin decelerates — the player reads it as the spin itself having
   * morphed Kat into this pose — then this frame is what shrinks away to
   * reveal the clue. Falls back to `artifactSrc` throughout when omitted.
   */
  artifactSrcAlt?: string
  /** Alt text for the artifact image. */
  artifactAlt?: string
  /**
   * Called once the sprite has shrunk away and the overlay has fully faded
   * (or immediately, if reduced motion / no artifact) — the caller's own
   * clue view should already be mounted underneath by this point so nothing
   * new needs to pop in.
   */
  onComplete: () => void
}
