import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { LetterStatus, WordleGuessGameProps } from './contract'
import { LetterWheel } from './LetterWheel'
import { ScallopedCard } from './ScallopedCard'
import { fonts, theme, usePrefersReducedMotion } from './theme'

interface SubmittedRow {
  letters: string[]
  statuses: LetterStatus[]
}

function tileBg(s: LetterStatus): string {
  if (s === 'correct') return theme.sage
  if (s === 'present') return theme.gold
  return theme.panelEdge
}

function tileText(s: LetterStatus): string {
  return s === 'absent' ? theme.textDim : theme.cream
}

function isAllCorrect(statuses: LetterStatus[]): boolean {
  return statuses.length > 0 && statuses.every((s) => s === 'correct')
}

/**
 * "Paw Print Puzzle" — a scalloped scrapbook page. Spin the petal reels to
 * guess Kat's word; each guess is scored and softly coloured. After
 * `maxAttempts` tries the answer is revealed. Calls `onResolved(solved)`.
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

  const attemptsUsed = submitted.length
  const locked = phase !== 'playing'

  const finish = (solved: boolean) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setPhase(solved ? 'solved' : 'revealed')
    window.setTimeout(() => onResolved(solved), reduced ? 300 : 1400)
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
      setGuess(answer.toUpperCase().split(''))
      finish(false)
    } else {
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
    <ScallopedCard maxWidth={460}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {/* Hero: shrunk character, tiny caption, then the hint as the main text. */}
        {artifactSrc && (
          <motion.img
            src={artifactSrc}
            alt={artifactAlt ?? ''}
            width={78}
            height={78}
            draggable={false}
            initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={
              reduced
                ? { duration: 0.3 }
                : { y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }
            }
            style={{ width: 78, height: 78, objectFit: 'contain' }}
          />
        )}

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: theme.sage,
          }}
        >
          Paw Print Puzzle
        </div>

        {hint && (
          <p
            style={{
              margin: 0,
              fontFamily: fonts.body,
              fontSize: 19,
              fontWeight: 600,
              lineHeight: 1.5,
              color: theme.text,
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            {hint}
          </p>
        )}

        {/* Submitted guesses as soft rounded tiles. */}
        {submitted.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {submitted.map((row, r) => {
              const isLastWrong = r === submitted.length - 1 && phase === 'playing'
              return (
                <motion.div
                  key={r}
                  animate={
                    isLastWrong && !reduced
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                  {...(isLastWrong ? { 'data-shake': shakeKey } : {})}
                  style={{ display: 'flex', gap: 6, justifyContent: 'center' }}
                >
                  {row.letters.map((letter, c) =>
                    isSpace(c) ? (
                      <div key={c} style={{ width: 16 }} aria-hidden="true" />
                    ) : (
                      <div
                        key={c}
                        style={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: fonts.display,
                          fontSize: 20,
                          fontWeight: 700,
                          color: tileText(row.statuses[c]),
                          background: tileBg(row.statuses[c]),
                          borderRadius: 12,
                          boxShadow: `0 2px 5px ${theme.panelEdge}88`,
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
        )}

        {/* Active input row: the petal reels. */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
            {guess.map((letter, i) =>
              isSpace(i) ? (
                <div key={i} aria-hidden="true" style={{ width: 22 }} />
              ) : (
                <LetterWheel
                  key={i}
                  value={letter}
                  onChange={(l) => setLetter(i, l)}
                  accent={theme.peach}
                />
              ),
            )}
          </div>
        )}

        {/* Footer: one compact group — button with attempt pips beneath it. */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={submit} style={submitStyle}>
              Sniff it out 🐾
            </button>
            <div style={{ display: 'flex', gap: 7 }} aria-label={`${maxAttempts - attemptsUsed} tries left`}>
              {Array.from({ length: maxAttempts }, (_, i) => {
                const spent = i < attemptsUsed
                return (
                  <span
                    key={i}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: spent ? 'transparent' : theme.peach,
                      border: `1.5px solid ${spent ? theme.panelEdge : theme.peach}`,
                      transition: 'background 0.2s ease',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {phase === 'revealed' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: theme.gold, fontFamily: fonts.display, fontSize: 16, fontWeight: 700 }}
            >
              The word was{' '}
              <strong style={{ letterSpacing: 2 }}>{answer.toUpperCase()}</strong> — come along! 🌸
            </motion.div>
          )}
          {phase === 'solved' && (
            <motion.div
              initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              style={{
                color: theme.sage,
                fontFamily: fonts.display,
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Found it! 🐾
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScallopedCard>
  )
}

const submitStyle: React.CSSProperties = {
  padding: '12px 30px',
  borderRadius: 999,
  border: 'none',
  background: theme.peach,
  color: theme.cream,
  fontFamily: fonts.display,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 0.5,
  cursor: 'pointer',
  boxShadow: `0 4px 0 ${theme.blush}, 0 6px 12px ${theme.peach}55`,
}
