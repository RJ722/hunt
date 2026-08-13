import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { getTag, tags } from '../data/tags'
import { getRiddle } from '../lib/loadRiddles'
import { evaluateGuess } from '../lib/wordle'
import { WordleGuessGame } from '../animation-kit/WordleGuessGame'
import { TagRiddleAnimation } from '../animation-kit/TagRiddleAnimation'
import { SolveTransition } from '../animation-kit/SolveTransition'
import { NotFoundScreen } from './NotFoundScreen'
import { CompletionScreen } from './CompletionScreen'

interface RiddleScreenProps {
  slug: string
}

// The very first non-final stop in tags.ts — only this riddle shows the
// "drag a letter" tip if the player hasn't spun anything after 6s. Every
// riddle's wheels auto-spin on mount regardless of this flag.
const firstStopSlug = tags.find((t) => !t.isFinal)?.slug

/**
 * Orchestrates a single tag stop:
 *   - final tag  -> completion celebration (skips the gate)
 *   - otherwise  -> Wordle gate, then the decoded clue to the next tag
 *   - unknown    -> friendly not-found fallback
 */
export function RiddleScreen({ slug }: RiddleScreenProps) {
  const tag = getTag(slug)
  const riddle = tag ? getRiddle(slug) : undefined
  const [phase, setPhase] = useState<'gate' | 'clue'>('gate')
  // Whether the current 'clue' phase was reached via a genuine solve (the
  // SolveTransition overlay covers the screen while it plays, so the clue
  // beneath should mount fully settled/instant) vs. the "ran out of tries"
  // reveal, which has no overlay and should play its normal entrance.
  const instantReveal = useRef(false)
  const [solveOverlay, setSolveOverlay] = useState(false)

  const boundEvaluate = useMemo(
    () => (guess: string) => evaluateGuess(guess, riddle?.answer ?? ''),
    [riddle?.answer],
  )

  if (!tag) return <NotFoundScreen reason="unknown" />

  if (tag.isFinal) {
    return (
      <CompletionScreen
        message={tag.completionMessage ?? 'Hunt complete. Well done!'}
      />
    )
  }

  if (!riddle) return <NotFoundScreen reason="unknown" />

  return (
    <>
      <AnimatePresence>
        {phase === 'gate' ? (
          <motion.div
            key="gate"
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', minWidth: 0 }}
          >
            <WordleGuessGame
              answerLength={riddle.answer.length}
              answer={riddle.answer}
              hint={riddle.hint}
              hint2={riddle.hint2}
              hint3={riddle.hint3}
              artifactSrc={riddle.artifactSrc}
              artifactAlt={riddle.title ? `${riddle.title} character` : 'Riddle character'}
              maxAttempts={6}
              showOnboarding={slug === firstStopSlug}
              evaluateGuess={boundEvaluate}
              onResolved={(solved) => {
                // On a genuine solve, throw up the full-screen payoff
                // *immediately* and mount the clue instantly underneath it
                // (hidden behind the opaque overlay) rather than gating the
                // clue's own mount on the overlay finishing.
                instantReveal.current = solved
                if (solved) setSolveOverlay(true)
                setPhase('clue')
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="clue"
            initial={instantReveal.current ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', minWidth: 0 }}
          >
            <TagRiddleAnimation
              riddleTitle={riddle.title}
              riddleText={riddle.clue}
              heroSrc={riddle.artifactSrcAlt ?? riddle.artifactSrc}
              heroAlt={riddle.title ? `${riddle.title} character` : 'Riddle character'}
              instant={instantReveal.current}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {solveOverlay && (
        <SolveTransition
          artifactSrc={riddle.artifactSrc}
          artifactSrcAlt={riddle.artifactSrcAlt}
          artifactAlt={riddle.title ? `${riddle.title} character` : 'Riddle character'}
          onComplete={() => setSolveOverlay(false)}
        />
      )}
    </>
  )
}
