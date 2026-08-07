import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { getTag } from '../data/tags'
import { getRiddle } from '../lib/loadRiddles'
import { evaluateGuess } from '../lib/wordle'
import { WordleGuessGame } from '../animation-kit/WordleGuessGame'
import { TagRiddleAnimation } from '../animation-kit/TagRiddleAnimation'
import { NotFoundScreen } from './NotFoundScreen'
import { CompletionScreen } from './CompletionScreen'

interface RiddleScreenProps {
  slug: string
}

/**
 * Orchestrates a single tag stop:
 *   - final tag  -> completion celebration (skips the gate)
 *   - otherwise  -> Wordle gate, then the decoded clue to the next tag
 *   - unknown    -> friendly not-found fallback
 */
export function RiddleScreen({ slug }: RiddleScreenProps) {
  const tag = getTag(slug)
  const riddle = tag ? getRiddle(slug) : undefined
  const [gateCleared, setGateCleared] = useState(false)

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
    <AnimatePresence mode="wait">
      {!gateCleared ? (
        <motion.div
          key="gate"
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.4 }}
        >
          <WordleGuessGame
            answerLength={riddle.answer.length}
            answer={riddle.answer}
            hint={riddle.hint}
            artifactSrc={riddle.artifactSrc}
            artifactAlt={riddle.title ? `${riddle.title} character` : 'Riddle character'}
            maxAttempts={6}
            evaluateGuess={boundEvaluate}
            onResolved={() => setGateCleared(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="clue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <TagRiddleAnimation riddleTitle={riddle.title} riddleText={riddle.clue} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
