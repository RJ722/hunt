import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import type { LetterStatus, WordleGuessGameProps } from './contract'
import { LetterWheel, MIN_SCALE, WHEEL_W_BASE } from './LetterWheel'
import { ScallopedCard } from './ScallopedCard'
import { fonts, theme, usePrefersReducedMotion } from './theme'

// Base (scale === 1) pixel metrics for the wheels row — must match the values
// baked into LetterWheel's own default rendering so the fit calculation below
// is accurate.
const GAP_BASE = 8
const SPACE_W_BASE = 22

interface SubmittedRow {
  letters: string[]
  statuses: LetterStatus[]
}

function tileBg(s: LetterStatus): string {
  if (s === 'correct') return theme.sage
  if (s === 'present') return theme.gold
  return theme.rose // wrong letter — soft terracotta "nope"
}

function isAllCorrect(statuses: LetterStatus[]): boolean {
  return statuses.length > 0 && statuses.every((s) => s === 'correct')
}

/**
 * A scalloped scrapbook page. Spin the letter reels — set in paw-print
 * badges — to guess Kat's word; each guess is scored and softly coloured.
 * Every reel auto-spins once on mount to invite play. After `maxAttempts`
 * tries the answer is revealed. Calls `onResolved(solved)`.
 */
export function WordleGuessGame({
  answerLength,
  answer,
  hint,
  hint2,
  hint3,
  artifactSrc,
  artifactAlt,
  maxAttempts,
  showOnboarding = false,
  evaluateGuess,
  onResolved,
}: WordleGuessGameProps) {
  const reduced = usePrefersReducedMotion()
  const katControls = useAnimationControls()
  // Space positions are fixed and never guessed — render a gap instead of a wheel.
  const answerChars = answer.toUpperCase().split('')
  const isSpace = (i: number) => answerChars[i] === ' '
  const firstLetterIndex = answerChars.findIndex((c) => c !== ' ')
  const initialGuess = () =>
    Array.from({ length: answerLength }, (_, i) => (isSpace(i) ? ' ' : 'A'))
  const [guess, setGuess] = useState<string[]>(initialGuess)
  const [submitted, setSubmitted] = useState<SubmittedRow[]>([])
  const [phase, setPhase] = useState<'playing' | 'solved' | 'revealed'>('playing')
  const [shakeKey, setShakeKey] = useState(0)
  const resolvedRef = useRef(false)
  const hasSpunRef = useRef(false)
  const [showHint, setShowHint] = useState(false)

  // Measure the actual available width for the wheels row and shrink every
  // wheel uniformly (via `scale`) so longer answers never overflow the
  // screen — works for any answer length and any device width, not just a
  // hardcoded breakpoint.
  const rowRef = useRef<HTMLDivElement>(null)
  const [rowWidth, setRowWidth] = useState(0)
  useEffect(() => {
    const el = rowRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setRowWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const unscaledRowWidth =
    answerChars.reduce((sum, c) => sum + (c === ' ' ? SPACE_W_BASE : WHEEL_W_BASE), 0) +
    GAP_BASE * (answerChars.length - 1)
  const wheelScale =
    rowWidth > 0 ? Math.min(1, Math.max(MIN_SCALE, rowWidth / unscaledRowWidth)) : 1

  const attemptsUsed = submitted.length
  const locked = phase !== 'playing'

  // Escalating stuck-player nudges — reveal once the player has genuinely
  // struggled, and stay visible (both can stack) so help never disappears.
  const activeDeepHints = [
    attemptsUsed >= 3 && hint2 ? hint2 : null,
    attemptsUsed >= maxAttempts - 1 && hint3 ? hint3 : null,
  ].filter((h): h is string => h !== null)

  const startFloat = () => {
    if (reduced) {
      katControls.set({ opacity: 1, y: 0, rotate: 0, scale: 1 })
      return
    }
    katControls.start({
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: [0, -6, 0],
      transition: { y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
    })
  }

  // Kick off the gentle idle float once on mount.
  useEffect(() => {
    katControls.set({ opacity: 0, scale: reduced ? 1 : 0.85, y: 0, rotate: 0 })
    katControls.start({ opacity: 1, scale: 1 }, { duration: 0.4 }).then(startFloat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On a wrong guess, Kat droops + shakes her head, then resumes floating.
  useEffect(() => {
    if (shakeKey === 0) return
    if (reduced) return
    let cancelled = false
    const react = async () => {
      await katControls.start({
        y: 8,
        rotate: [0, -9, 9, -6, 6, 0],
        transition: { duration: 0.55, ease: 'easeInOut' },
      })
      if (!cancelled) startFloat()
    }
    react()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeKey])

  // First-riddle-only nudge: if the player hasn't spun a single wheel within
  // 20s of landing here, surface a small dismissible tip. Once they spin
  // anything (or dismiss it) it never reappears for this screen.
  useEffect(() => {
    if (!showOnboarding) return
    const timer = window.setTimeout(() => {
      if (!hasSpunRef.current && phase === 'playing') setShowHint(true)
    }, 20000)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboarding])

  const handleUserSpin = () => {
    hasSpunRef.current = true
    setShowHint(false)
  }

  const dismissHint = () => {
    setShowHint(false)
  }

  const finish = (solved: boolean) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    setPhase(solved ? 'solved' : 'revealed')
    if (solved) {
      // A correct solve hands straight off to the SolveTransition payoff,
      // which covers the screen immediately — no reason to wait here at all.
      onResolved(true)
      return
    }
    // The consolation "revealed after running out of tries" case has no
    // follow-up animation, so it keeps its longer, calmer pause.
    window.setTimeout(() => onResolved(false), reduced ? 0 : 1400)
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
            animate={katControls}
            style={{ width: 78, height: 78, objectFit: 'contain' }}
          />
        )}

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            color: theme.sage,
          }}
        >
          🐾 Spin each letter to spell the word
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

        {/* Attempt pips — used tries fill in, sitting above the guess history. */}
        {phase === 'playing' && (
          <div
            style={{ display: 'flex', gap: 7 }}
            aria-label={`${maxAttempts - attemptsUsed} tries left`}
          >
            {Array.from({ length: maxAttempts }, (_, i) => {
              const spent = i < attemptsUsed
              return (
                <span
                  key={i}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: spent ? theme.rose : 'transparent',
                    border: `1.5px solid ${spent ? theme.rose : theme.panelEdge}`,
                    transition: 'background 0.2s ease',
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Stuck-player nudges — deeper hints that stack in once earned. */}
        {phase === 'playing' && activeDeepHints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 320 }}>
            <AnimatePresence initial={false}>
              {activeDeepHints.map((h, i) => (
                <motion.div
                  key={i}
                  initial={reduced ? false : { opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '9px 13px',
                    borderRadius: 14,
                    background: theme.lavenderSoft,
                    border: `1.5px dashed ${theme.lavender}`,
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: theme.text,
                  }}
                >
                  <span aria-hidden="true">💡</span>
                  <span>{h}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Submitted guesses as soft rounded tiles. Only the most recent
            attempt is shown — older ones slide up and fade out as a new one
            replaces them, so the card doesn't keep growing (or need to
            scroll) as retries pile up. The wrapper reserves this row's
            height from the very first render (even with zero guesses) so
            that the *first* wrong guess doesn't suddenly grow the card —
            on short viewports (e.g. iPhone 14) that growth was enough to
            push the page into a scrollbar-visible state. */}
        <div style={{ minHeight: Math.round(40 * wheelScale), display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {submitted.length > 0 &&
              (() => {
                const r = submitted.length - 1
                const row = submitted[r]
                const shouldShake = phase === 'playing'
                return (
                  <motion.div
                    key={r}
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    animate={
                      shouldShake && !reduced
                        ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] }
                        : { opacity: 1, y: 0 }
                    }
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
                    transition={{ duration: 0.42 }}
                    {...(shouldShake ? { 'data-shake': shakeKey } : {})}
                    style={{ display: 'flex', gap: Math.round(6 * wheelScale), justifyContent: 'center' }}
                  >
                    {row.letters.map((letter, c) =>
                      isSpace(c) ? (
                        <div key={c} style={{ width: Math.round(16 * wheelScale) }} aria-hidden="true" />
                      ) : (
                        <div
                          key={c}
                          style={{
                            width: Math.round(40 * wheelScale),
                            height: Math.round(40 * wheelScale),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: fonts.display,
                            fontSize: Math.round(20 * wheelScale),
                            fontWeight: 700,
                            color: theme.cream,
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
              })()}
          </AnimatePresence>
        </div>

        {/* Active input row: the letter reels. */}
        {phase === 'playing' && (
          <div
            ref={rowRef}
            style={{
              display: 'flex',
              gap: Math.round(GAP_BASE * wheelScale),
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {guess.map((letter, i) =>
              isSpace(i) ? (
                <div key={i} aria-hidden="true" style={{ width: Math.round(SPACE_W_BASE * wheelScale) }} />
              ) : (
                <div key={i} style={{ position: 'relative' }}>
                  <LetterWheel
                    value={letter}
                    onChange={(l) => setLetter(i, l)}
                    accent={theme.peach}
                    demo
                    onUserSpin={handleUserSpin}
                    scale={wheelScale}
                  />

                  {i === firstLetterIndex && (
                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 12,
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 6,
                            padding: '8px 10px',
                            borderRadius: 14,
                            background: theme.text,
                            color: theme.cream,
                            fontFamily: fonts.body,
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            whiteSpace: 'normal',
                            width: 'max-content',
                            maxWidth: 'min(220px, calc(100vw - 48px))',
                            boxShadow: `0 6px 16px ${theme.panelEdge}aa`,
                          }}
                        >
                          <span aria-hidden="true" style={hintArrowStyle} />
                          <span style={{ flex: 1 }}>👆 Drag a letter up or down to change it</span>
                          <button
                            type="button"
                            onClick={dismissHint}
                            aria-label="Dismiss tip"
                            style={hintCloseStyle}
                          >
                            ×
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ),
            )}
          </div>
        )}

        {/* Footer: a quiet "check" affordance + gentle nudge after a wrong try.
            The message wrapper reserves its line height from the start (see
            the submitted-row wrapper above for why) so the first wrong
            guess doesn't grow the card and tip a short viewport into
            scrolling. */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={submit} style={submitStyle}>
              Check the word
            </button>
            <div style={{ minHeight: 18, display: 'flex', alignItems: 'center' }}>
              {submitted.length > 0 && (
                <motion.div
                  key={submitted.length}
                  initial={reduced ? false : { opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.rose,
                  }}
                >
                  Not quite — give it another spin 🐾
                </motion.div>
              )}
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
  padding: '9px 22px',
  borderRadius: 999,
  border: `1.5px solid ${theme.panelEdge}`,
  background: 'transparent',
  color: theme.textDim,
  fontFamily: fonts.display,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 0.3,
  cursor: 'pointer',
}

const hintArrowStyle: React.CSSProperties = {
  position: 'absolute',
  top: -5,
  left: 20,
  transform: 'rotate(45deg)',
  width: 10,
  height: 10,
  background: theme.text,
  borderRadius: 2,
}

const hintCloseStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: theme.cream,
  fontSize: 16,
  lineHeight: 1,
  padding: '2px 0 2px 4px',
  cursor: 'pointer',
  opacity: 0.8,
}
