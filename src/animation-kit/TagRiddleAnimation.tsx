import { motion } from 'motion/react'
import type { TagRiddleAnimationProps } from './contract'
import { fonts, theme, usePrefersReducedMotion } from './theme'

const PETALS = [
  { c: theme.blush, a: 0 },
  { c: theme.peachSoft, a: 45 },
  { c: theme.lavenderSoft, a: 90 },
  { c: theme.blush, a: 135 },
  { c: theme.peachSoft, a: 180 },
  { c: theme.lavenderSoft, a: 225 },
  { c: theme.blush, a: 270 },
  { c: theme.peachSoft, a: 315 },
]

/**
 * Clue reveal: a little flower blooms open — petals unfurl outward from a
 * folded bud, a ribbon accent settles, and the clue text blossoms in word by
 * word. Reduced motion shows everything at rest immediately.
 */
export function TagRiddleAnimation({ riddleTitle, riddleText }: TagRiddleAnimationProps) {
  const reduced = usePrefersReducedMotion()
  const words = riddleText.split(/\s+/)

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        textAlign: 'center',
        padding: '8px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}
    >
      {/* Blooming flower */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <g transform="translate(60 60)">
            {PETALS.map((p, i) => (
              <motion.ellipse
                key={i}
                rx="15"
                ry="26"
                fill={p.c}
                initial={
                  reduced
                    ? false
                    : { scale: 0.1, rotate: p.a, y: 0, opacity: 0 }
                }
                animate={{ scale: 1, rotate: p.a, y: -24, opacity: 1 }}
                transition={{
                  delay: reduced ? 0 : 0.08 * i,
                  type: 'spring',
                  stiffness: 220,
                  damping: 14,
                }}
                style={{ originX: '50%', originY: '100%' }}
              />
            ))}
            <motion.circle
              r="18"
              fill={theme.gold}
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: reduced ? 0 : 0.7, type: 'spring', stiffness: 260, damping: 16 }}
            />
            <motion.text
              y="6"
              textAnchor="middle"
              fontSize="20"
              initial={reduced ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduced ? 0 : 0.85, duration: 0.4 }}
            >
              🐾
            </motion.text>
          </g>
        </svg>
        {/* ribbon accent */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: -6, rotate: -12 }}
          animate={{ opacity: 1, y: 0, rotate: -12 }}
          transition={{ delay: reduced ? 0 : 0.95, type: 'spring', stiffness: 240, damping: 15 }}
          style={{ position: 'absolute', top: -6, right: 6, fontSize: 22 }}
        >
          🎀
        </motion.div>
      </div>

      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: theme.lavender,
        }}
      >
        {riddleTitle ?? 'A note from Kat'}
      </div>

      <p
        aria-label={riddleText}
        style={{
          margin: 0,
          fontFamily: fonts.body,
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.65,
          color: theme.text,
        }}
      >
        {words.map((w, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: reduced ? 0 : 1.1 + i * 0.05, duration: 0.4 }}
            style={{ display: 'inline-block', marginRight: '0.32em' }}
          >
            {w}
          </motion.span>
        ))}
      </p>
    </div>
  )
}
