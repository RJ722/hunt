import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useAnimationControls } from 'motion/react'
import type { SolveTransitionProps } from './contract'
import { theme, usePrefersReducedMotion } from './theme'

const SPRITE_SIZE = 78
const SPINS = 2 // full 360s before the final decelerating half-turn
const MAIN_SPIN_S = 0.85
const LAST_TURN_S = 0.35
const SHRINK_S = 0.55

/**
 * The "you got it!" payoff: Kat tumbles in 3D (a real coin-flip `rotateY`,
 * not a flat pinwheel) while growing to fill almost the whole screen. On her
 * last, decelerating half-turn she's swapped for a second sprite frame —
 * read as the spin itself having morphed her — and it's *that* frame which
 * then shrinks down and glides onto the clue's own hero image (her
 * identical twin, already sitting there underneath). She lands on it and
 * stays; only this overlay's background dissolves away around her, so she
 * simply remains on the clue page rather than disappearing. Rendered into a
 * fixed, full-viewport portal so it can escape the small scalloped card and
 * read as genuinely full-screen. Reduced-motion players (or riddles with no
 * artifact) skip it entirely.
 */
export function SolveTransition({
  artifactSrc,
  artifactSrcAlt,
  artifactAlt,
  onComplete,
}: SolveTransitionProps) {
  const reduced = usePrefersReducedMotion()
  const [altFrame, setAltFrame] = useState(false)
  const sprite = useAnimationControls()
  const overlay = useAnimationControls()

  useEffect(() => {
    if (reduced || !artifactSrc) {
      onComplete()
      return
    }
    let cancelled = false
    const run = async () => {
      const growTarget = (Math.min(window.innerWidth, window.innerHeight) * 0.82) / SPRITE_SIZE

      // Main spin + grow, still on sprite 1.
      await sprite.start({
        opacity: 1,
        scale: growTarget * 0.85,
        rotateY: (SPINS - 1) * 360,
        transition: { duration: MAIN_SPIN_S, ease: 'easeInOut' },
      })
      if (cancelled) return

      // Final, decelerating half-turn — swap to sprite 2 right as it begins,
      // so the spin reads as having morphed her into this pose.
      setAltFrame(true)
      await sprite.start({
        scale: growTarget,
        rotateY: SPINS * 360,
        transition: { duration: LAST_TURN_S, ease: 'easeOut' },
      })
      if (cancelled) return

      // Sprite 2 shrinks (and glides) onto the exact spot/size of the clue's
      // own hero image — the very same sprite2 frame, already mounted
      // underneath and hidden behind this overlay. It lands pixel-for-pixel
      // on top of its twin and *stays put*; only the overlay dissolves
      // around it, so nothing visibly swaps — she simply stays on the page.
      const target = document.querySelector<HTMLElement>('[data-solve-target]')
      let dx = 0
      let dy = 0
      let landingScale = growTarget * 0.15
      if (target) {
        const rect = target.getBoundingClientRect()
        dx = rect.left + rect.width / 2 - window.innerWidth / 2
        dy = rect.top + rect.height / 2 - window.innerHeight / 2
        landingScale = Math.min(rect.width, rect.height) / SPRITE_SIZE
      }
      await Promise.all([
        sprite.start({
          x: dx,
          y: dy,
          scale: landingScale,
          transition: { duration: SHRINK_S, ease: 'easeIn' },
        }),
        overlay.start({
          opacity: 0,
          transition: { duration: SHRINK_S, ease: 'easeIn', delay: SHRINK_S * 0.4 },
        }),
      ])
      if (!cancelled) onComplete()
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (reduced || !artifactSrc) return null

  const spriteSrc = altFrame && artifactSrcAlt ? artifactSrcAlt : artifactSrc

  return createPortal(
    <motion.div
      animate={overlay}
      initial={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg,
        perspective: 900,
      }}
    >
      <motion.img
        src={spriteSrc}
        alt={artifactAlt ?? ''}
        width={SPRITE_SIZE}
        height={SPRITE_SIZE}
        draggable={false}
        initial={{ opacity: 0, scale: 1, rotateY: 0, x: 0, y: 0 }}
        animate={sprite}
        style={{
          width: SPRITE_SIZE,
          height: SPRITE_SIZE,
          objectFit: 'contain',
          transformPerspective: 900,
        }}
      />
    </motion.div>,
    document.body,
  )
}
