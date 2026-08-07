import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { TagRiddleAnimationProps } from './contract'
import { theme, usePrefersReducedMotion } from './theme'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

/**
 * Clue-reveal animation: the text arrives like a decoding transmission —
 * scrambled glyphs resolving left-to-right into readable neon text.
 */
export function TagRiddleAnimation({ riddleTitle, riddleText }: TagRiddleAnimationProps) {
  const reduced = usePrefersReducedMotion()
  const [revealed, setRevealed] = useState(reduced ? riddleText.length : 0)
  const [, forceTick] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    if (reduced) {
      setRevealed(riddleText.length)
      return
    }
    setRevealed(0)
    let raf = 0
    const start = performance.now()
    const perChar = 34 // ms of scramble before each character locks in

    const loop = (now: number) => {
      const locked = Math.min(riddleText.length, Math.floor((now - start) / perChar))
      setRevealed(locked)
      frame.current += 1
      forceTick(frame.current) // keep scrambling the unresolved tail
      if (locked < riddleText.length) {
        raf = requestAnimationFrame(loop)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [riddleText, reduced])

  const rendered = riddleText
    .split('')
    .map((ch, i) => {
      if (i < revealed || ch === ' ' || ch === '\n') return ch
      return randomGlyph()
    })
    .join('')

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        textAlign: 'center',
        padding: '8px 20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          letterSpacing: 4,
          color: theme.magenta,
          textShadow: `0 0 10px ${theme.magenta}`,
          marginBottom: 18,
        }}
      >
        ▸ {riddleTitle ? riddleTitle.toUpperCase() : 'INCOMING TRANSMISSION'}
      </motion.div>

      <p
        aria-label={riddleText}
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 19,
          lineHeight: 1.7,
          color: theme.cyan,
          textShadow: `0 0 12px ${theme.cyan}66`,
          whiteSpace: 'pre-wrap',
          minHeight: 60,
        }}
      >
        {rendered}
        {revealed < riddleText.length && (
          <span style={{ color: theme.magenta }}>█</span>
        )}
      </p>
    </div>
  )
}
