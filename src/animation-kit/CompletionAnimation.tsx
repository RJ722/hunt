import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { CompletionAnimationProps } from './contract'
import { fonts, theme, usePrefersReducedMotion } from './theme'
import partyKat from './assets/party-kat.svg?url'

const CREDIT = 'Made with 🧶 by RJ722'
const CONFETTI_COLORS = [theme.peach, theme.sage, theme.lavender, theme.gold, theme.blush]
const BALLOON_COLORS = [theme.peach, theme.sage, theme.lavender, theme.gold, theme.blush]

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Completion celebration: a party-hat Kat pops in, a ribbon of confetti bursts
 * and rains down, balloons drift up, and "Kat found it!" springs into place.
 * Reduced motion shows a calm, static version.
 */
export function CompletionAnimation({ message }: CompletionAnimationProps) {
  const reduced = usePrefersReducedMotion()

  const confetti = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        dx: rand(-190, 190),
        dy: rand(180, 360),
        delay: rand(0, 0.6),
        dur: rand(1.8, 3.2),
        rot: rand(-540, 540),
        size: rand(7, 13),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      })),
    [],
  )

  const balloons = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: (i - 2) * 66 + rand(-12, 12),
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        delay: rand(0, 0.5),
        rise: rand(-150, -70),
        sway: rand(6, 16),
      })),
    [],
  )

  const sparkles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: rand(-150, 150),
        y: rand(-120, 60),
        delay: rand(0.4, 1.8),
      })),
    [],
  )

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: 440,
        overflow: 'hidden',
      }}
    >
      {/* soft radial glow */}
      {!reduced && (
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '38%',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.gold}55, transparent 70%)`,
            zIndex: 0,
          }}
        />
      )}

      {/* balloons drifting up */}
      {!reduced &&
        balloons.map((b) => (
          <motion.div
            key={`b-${b.id}`}
            initial={{ x: b.x, y: 300, opacity: 0 }}
            animate={{
              x: [b.x, b.x + b.sway, b.x - b.sway, b.x],
              y: b.rise,
              opacity: 1,
            }}
            transition={{
              y: { delay: b.delay, duration: 2.6, ease: 'easeOut' },
              opacity: { delay: b.delay, duration: 0.5 },
              x: { delay: b.delay + 2.4, duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ position: 'absolute', top: '50%', zIndex: 0 }}
          >
            <div
              style={{
                width: 34,
                height: 42,
                borderRadius: '50%',
                background: b.color,
                boxShadow: `inset -6px -8px 0 ${theme.text}14`,
              }}
            />
            <div style={{ width: 1, height: 40, background: `${theme.text}55`, margin: '0 auto' }} />
          </motion.div>
        ))}

      {/* confetti burst + rain */}
      {!reduced &&
        confetti.map((c) => (
          <motion.span
            key={`c-${c.id}`}
            initial={{ x: 0, y: -30, opacity: 0, rotate: 0 }}
            animate={{ x: c.dx, y: c.dy, opacity: [0, 1, 1, 0], rotate: c.rot }}
            transition={{ delay: c.delay, duration: c.dur, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              top: '34%',
              width: c.size,
              height: c.round ? c.size : c.size * 0.5,
              borderRadius: c.round ? '50%' : 2,
              background: c.color,
              zIndex: 1,
            }}
          />
        ))}

      {/* twinkling sparkles */}
      {!reduced &&
        sparkles.map((s) => (
          <motion.span
            key={`s-${s.id}`}
            initial={{ x: s.x, y: s.y, opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ delay: s.delay, duration: 1.1, repeat: Infinity, repeatDelay: 1.4 }}
            style={{
              position: 'absolute',
              top: '40%',
              fontSize: 16,
              zIndex: 1,
            }}
          >
            ✨
          </motion.span>
        ))}

      {/* Party Kat */}
      <motion.img
        src={partyKat}
        alt="Kat wearing a party hat"
        width={148}
        height={148}
        draggable={false}
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.3, y: 20 }}
        animate={
          reduced
            ? { opacity: 1 }
            : { opacity: 1, scale: [0.3, 1.15, 0.95, 1], y: [20, -6, 0] }
        }
        transition={{ duration: reduced ? 0 : 0.9, ease: 'backOut' }}
        style={{ width: 148, height: 148, objectFit: 'contain', zIndex: 2 }}
      />

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.5, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.5, type: 'spring', stiffness: 300, damping: 14 }}
        style={{
          fontFamily: fonts.display,
          fontSize: 34,
          fontWeight: 800,
          color: theme.peach,
          textShadow: `0 2px 0 ${theme.cream}`,
          zIndex: 2,
        }}
      >
        Kat found it! 🎉
      </motion.div>

      <motion.p
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.9, duration: 0.6 }}
        style={{
          maxWidth: 400,
          textAlign: 'center',
          fontFamily: fonts.body,
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1.6,
          color: theme.text,
          zIndex: 2,
          padding: '0 20px',
          margin: 0,
        }}
      >
        {message}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: reduced ? 0 : 1.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 8,
          fontFamily: fonts.body,
          fontSize: 12,
          color: theme.textDim,
          zIndex: 2,
        }}
      >
        {CREDIT}
      </motion.div>
    </div>
  )
}
