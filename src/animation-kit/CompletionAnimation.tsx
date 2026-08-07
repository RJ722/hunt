import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { CompletionAnimationProps } from './contract'
import { theme, usePrefersReducedMotion } from './theme'

const CREDIT = 'Made with 🖤 by RJ722'

/**
 * Completion celebration: a warp-speed streak into a neon "hunt complete"
 * reveal with a particle burst, then the customizable message.
 */
export function CompletionAnimation({ message }: CompletionAnimationProps) {
  const reduced = usePrefersReducedMotion()

  // Pre-compute warp streak lines and burst particles.
  const streaks = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        angle: (i / 28) * Math.PI * 2,
        delay: Math.random() * 0.2,
        hue: [theme.cyan, theme.magenta, theme.purple][i % 3],
      })),
    [],
  )
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: (Math.random() - 0.5) * 240,
        hue: [theme.cyan, theme.magenta, theme.green][i % 3],
      })),
    [],
  )

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        minHeight: 360,
        overflow: 'hidden',
      }}
    >
      {/* Warp streaks radiating outward. */}
      {!reduced &&
        streaks.map((s) => (
          <motion.span
            key={s.id}
            initial={{ opacity: 0, scaleY: 0.2, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scaleY: [0.2, 1.6, 0.2],
              x: Math.cos(s.angle) * 260,
              y: Math.sin(s.angle) * 260,
            }}
            transition={{ duration: 1.1, delay: s.delay, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 2,
              height: 60,
              borderRadius: 2,
              background: s.hue,
              boxShadow: `0 0 12px ${s.hue}`,
              transform: `rotate(${s.angle}rad)`,
            }}
          />
        ))}

      {/* Particle burst. */}
      {!reduced &&
        particles.map((p) => (
          <motion.span
            key={`p-${p.id}`}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0, 1, 0.4] }}
            transition={{ duration: 1.4, delay: 0.5 + Math.random() * 0.3 }}
            style={{
              position: 'absolute',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: p.hue,
              boxShadow: `0 0 10px ${p.hue}`,
            }}
          />
        ))}

      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.4, letterSpacing: reduced ? 6 : 26 }}
        animate={{ opacity: 1, scale: 1, letterSpacing: 6 }}
        transition={{ delay: reduced ? 0 : 0.6, duration: 0.7, ease: 'backOut' }}
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 30,
          fontWeight: 800,
          color: theme.cyan,
          textShadow: `0 0 20px ${theme.cyan}, 0 0 40px ${theme.magenta}88`,
          zIndex: 2,
        }}
      >
        HUNT COMPLETE
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 1.1, duration: 0.6 }}
        style={{
          maxWidth: 440,
          textAlign: 'center',
          fontSize: 18,
          lineHeight: 1.6,
          color: theme.text,
          zIndex: 2,
          padding: '0 20px',
        }}
      >
        {message}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: reduced ? 0 : 1.6, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 12,
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
