import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { LetterStatus, WordleGuessGameProps } from './contract'
import { LetterWheel } from './LetterWheel'
import { theme, usePrefersReducedMotion } from './theme'

interface SubmittedRow {
  letters: string[]
  statuses: LetterStatus[]
}

function statusColor(s: LetterStatus): string {
  if (s === 'correct') return theme.green
  if (s === 'present') return theme.amber
  return theme.textDim
}

function isAllCorrect(statuses: LetterStatus[]): boolean {
  return statuses.length > 0 && statuses.every((s) => s === 'correct')
}

/**
 * Wordle-style access panel. Spin the letter wheels, submit a guess, and the
 * component scores it. After `maxAttempts` failed guesses it reveals `answer`.
 * Calls `onResolved(solved)` once cleared.
 */
export function WordleGuessGame({
  answerLength,
  answer,
  hint,
  artifactSrc,
  artifactAlt,
  maxAttempts,
  evaluateGuess,
  onResolved,
}: WordleGuessGameProps) {
  const reduced = usePrefersReducedMotion()
  // Space positions are fixed and never guessed — render a gap instead of a wheel.
  const answerChars = answer.toUpperCase().split('')
  const isSpace = (i: number) => answerChars[i] === ' '
  const initialGuess = () =>
    Array.from({ length: answerLength }, (_, i) => (isSpace(i) ? ' ' : 'A'))
  const [guess, setGuess] = useState<string[]>(initialGuess)
  const [submitted, setSubmitted] = useState<SubmittedRow[]>([])
  const [phase, setPhase] = useState<'playing' | 'solved' | 'revealed'>('playing')
  const [shakeKey, setShakeKey] = useState(0)
  const resolvedRef = useRef(false)

  const attemptsLeft = maxAttempts - submitted.length
  const locked = phase !== 'playing'

  const finish = (solved: boolean) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setPhase(solved ? 'solved' : 'revealed')
    window.setTimeout(() => onResolved(solved), reduced ? 300 : 1300)
  }

  const submit = () => {
    if (locked) return
    const word = guess.join('')
    const statuses = evaluateGuess(word)
    const row: SubmittedRow = { letters: [...guess], statuses }
    const nextSubmitted = [...submitted, row]
    setSubmitted(nextSubmitted)

    if (isAllCorrect(statuses)) {
      finish(true)
    } else if (nextSubmitted.length >= maxAttempts) {
      // Reveal the answer on the wheels, then resolve as unsolved.
      setGuess(answer.toUpperCase().split(''))
      finish(false)
    } else {
      // Wrong but attempts remain — glitch/shake feedback.
      setShakeKey((k) => k + 1)
    }
  }

  const setLetter = (i: number, letter: string) => {
    setGuess((prev) => {
      const next = [...prev]
      next[i] = letter
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      {artifactSrc && (
        <motion.img
          src={artifactSrc}
          alt={artifactAlt ?? ''}
          width={120}
          height={120}
          draggable={false}
          initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
          animate={
            reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: [0, -8, 0] }
          }
          transition={
            reduced
              ? { duration: 0.3 }
              : { y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }
          }
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
            filter: `drop-shadow(0 0 16px ${theme.cyan}66)`,
            userSelect: 'none',
          }}
        />
      )}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: 4,
            color: theme.cyan,
            textShadow: `0 0 10px ${theme.cyan}`,
            fontSize: 14,
          }}
        >
          ACCESS PANEL
        </div>
        {hint && (
          <div style={{ marginTop: 8, color: theme.textDim, fontSize: 14, maxWidth: 320 }}>
            {hint}
          </div>
        )}
      </div>

      {/* Submitted guesses as colour-coded tiles. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {submitted.map((row, r) => {
          const isLastWrong =
            r === submitted.length - 1 && phase === 'playing'
          return (
            <motion.div
              key={r}
              // Glitch/shake only the most recent wrong row.
              animate={
                isLastWrong && !reduced
                  ? { x: [0, -6, 6, -4, 4, 0], opacity: [1, 0.6, 1, 0.7, 1] }
                  : {}
              }
              // Re-trigger via key change on each wrong submit.
              transition={{ duration: 0.4 }}
              {...(isLastWrong ? { 'data-shake': shakeKey } : {})}
              style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
            >
              {row.letters.map((letter, c) =>
                isSpace(c) ? (
                  <div key={c} style={{ width: 20 }} aria-hidden="true" />
                ) : (
                  <div
                    key={c}
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 22,
                      fontWeight: 700,
                      color: theme.bg,
                      background: statusColor(row.statuses[c]),
                      borderRadius: 8,
                      boxShadow: `0 0 12px ${statusColor(row.statuses[c])}99`,
                    }}
                  >
                    {letter}
                  </div>
                ),
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Active input row: the letter wheels. Hidden once resolved. */}
      {phase === 'playing' && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          {guess.map((letter, i) =>
            isSpace(i) ? (
              <div
                key={i}
                aria-hidden="true"
                style={{ width: 24 }}
              />
            ) : (
              <LetterWheel
                key={i}
                value={letter}
                onChange={(l) => setLetter(i, l)}
                accent={theme.cyan}
              />
            ),
          )}
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={submit} style={submitStyle}>
            TRANSMIT ▸
          </button>
          <div style={{ color: theme.textDim, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left
          </div>
        </div>
      )}

      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: theme.amber, fontSize: 14, fontFamily: 'ui-monospace, monospace' }}
          >
            The code was <strong style={{ letterSpacing: 3 }}>{answer.toUpperCase()}</strong> — routing you onward…
          </motion.div>
        )}
        {phase === 'solved' && (
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              color: theme.green,
              fontSize: 16,
              fontFamily: 'ui-monospace, monospace',
              textShadow: `0 0 14px ${theme.green}`,
            }}
          >
            ✔ ACCESS GRANTED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const submitStyle: React.CSSProperties = {
  padding: '12px 28px',
  borderRadius: 10,
  border: `1px solid ${theme.cyan}`,
  background: 'transparent',
  color: theme.cyan,
  fontFamily: 'ui-monospace, monospace',
  fontSize: 15,
  letterSpacing: 2,
  cursor: 'pointer',
  boxShadow: `0 0 16px ${theme.cyan}55, inset 0 0 12px ${theme.cyan}22`,
}
