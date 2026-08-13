import { motion } from 'motion/react'
import type { TagRiddleAnimationProps } from './contract'
import { fonts, theme, usePrefersReducedMotion } from './theme'

/**
 * Clue reveal: the sprite SolveTransition landed on sits right where it
 * dropped, the clue text blossoms in word by word beneath it. Reduced
 * motion (or `instant`, coming straight off the landing) shows everything
 * at rest immediately.
 */
export function TagRiddleAnimation({
  riddleTitle,
  riddleText,
  heroSrc,
  heroAlt,
  instant,
}: TagRiddleAnimationProps) {
  // `instant` forces the same "already settled" render as reduced motion —
  // used when this content was just shown on SolveTransition's back face so
  // it doesn't visibly replay its entrance from scratch a moment later.
  const reduced = usePrefersReducedMotion() || instant
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
      {/* The landing target SolveTransition's sprite shrinks onto — this
          exact spot/size — so it reads as the sprite settling here rather
          than a separate graphic popping in behind it. */}
      {heroSrc && (
        <motion.div
          data-solve-target
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ width: 120, height: 120 }}
        >
          <img
            src={heroSrc}
            alt={heroAlt ?? ''}
            draggable={false}
            width={120}
            height={120}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </motion.div>
      )}

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
            transition={{ delay: reduced ? 0 : 0.3 + i * 0.05, duration: 0.4 }}
            style={{ display: 'inline-block', marginRight: '0.32em' }}
          >
            {w}
          </motion.span>
        ))}
      </p>
    </div>
  )
}

