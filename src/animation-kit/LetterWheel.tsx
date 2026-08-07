import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { LETTERS, theme, usePrefersReducedMotion } from './theme'

const ITEM_H = 52
const COPIES = 3
const N = LETTERS.length // 26
const MIDDLE = N // index where the middle alphabet copy starts

const mod = (n: number, m: number) => ((n % m) + m) % m
const spring = { type: 'spring', stiffness: 480, damping: 42 } as const
// Seconds of coasting projected from the release velocity — higher = longer flick.
const MOMENTUM = 0.28

// Three stacked copies of the alphabet so the reel can wrap seamlessly. After
// every interaction we snap back into the middle copy (invisible, same letter),
// leaving a full alphabet of headroom in both directions.
const STRIP = Array.from({ length: COPIES * N }, (_, i) => LETTERS[i % N])

interface LetterWheelProps {
  value: string
  onChange: (letter: string) => void
  disabled?: boolean
  accent?: string
}

/**
 * A circular vertical A–Z reel. Drag/swipe or use ▲/▼ to spin; scrolling past
 * A wraps to Z and past Z wraps to A. Snaps to the nearest letter and emits it.
 */
export function LetterWheel({
  value,
  onChange,
  disabled = false,
  accent = theme.cyan,
}: LetterWheelProps) {
  const reduced = usePrefersReducedMotion()
  const letterIndex = Math.max(0, LETTERS.indexOf(value.toUpperCase()))
  // vIndex lives in the middle copy so there is room to wrap either way.
  const y = useMotionValue(-(MIDDLE + letterIndex) * ITEM_H)
  const busy = useRef(false)

  // Re-align if `value` is changed from outside (e.g. reset / reveal) while idle.
  useEffect(() => {
    if (busy.current) return
    y.set(-(MIDDLE + letterIndex) * ITEM_H)
  }, [letterIndex, y])

  // Animate the reel by `delta` items, then recenter into the middle copy.
  const spin = (delta: number, fromY: number) => {
    if (disabled) return
    const li = mod(letterIndex + delta, N)
    busy.current = true
    onChange(LETTERS[li])
    const target = fromY - delta * ITEM_H
    const commit = () => {
      y.set(-(MIDDLE + li) * ITEM_H) // invisible: same letter, middle copy
      busy.current = false
    }
    if (reduced) {
      commit()
    } else {
      animate(y, target, { ...spring, onComplete: commit })
    }
  }

  const step = (delta: number) => spin(delta, y.get())

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.85 : 1,
      }}
    >
      <button
        type="button"
        aria-label="previous letter"
        onClick={() => step(-1)}
        disabled={disabled}
        style={arrowStyle(accent, disabled)}
      >
        ▲
      </button>

      <div
        role="spinbutton"
        aria-valuetext={value}
        aria-label="letter"
        style={{
          position: 'relative',
          width: 56,
          height: ITEM_H * 3,
          overflow: 'hidden',
          borderRadius: 12,
          background: theme.panel,
          border: `1px solid ${theme.panelEdge}`,
          boxShadow: `0 0 14px ${accent}44, inset 0 0 22px #0009`,
          touchAction: 'none',
        }}
      >
        {/* center selection frame */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: ITEM_H,
            height: ITEM_H,
            borderTop: `1px solid ${accent}66`,
            borderBottom: `1px solid ${accent}66`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        <div style={fadeStyle('top')} />
        <div style={fadeStyle('bottom')} />

        <motion.div
          // `top: ITEM_H` centers the selected item in the middle row.
          style={{ y, position: 'absolute', left: 0, right: 0, top: ITEM_H, touchAction: 'none' }}
          drag={disabled ? false : 'y'}
          dragConstraints={{ top: -(STRIP.length - 1) * ITEM_H, bottom: 0 }}
          dragElastic={0.06}
          dragMomentum={false}
          onDragStart={() => {
            busy.current = true
          }}
          onDragEnd={(_e, info) => {
            const current = y.get()
            const velocity = info.velocity.y // px/s (up = negative)
            // Project where the flick would coast to, so a fast swipe carries
            // through several letters instead of stopping under the finger.
            const projected = current + velocity * MOMENTUM
            const rawNearest = Math.round(-projected / ITEM_H)
            // Keep the settle target inside the rendered strip.
            const maxIndex = STRIP.length - 1
            const nearest = Math.min(Math.max(rawNearest, 0), maxIndex)
            const li = mod(nearest, N)
            onChange(LETTERS[li])
            const settle = () => {
              y.set(-(MIDDLE + li) * ITEM_H)
              busy.current = false
            }
            if (reduced) {
              settle()
            } else {
              // Seed the spring with the release velocity for a continuous glide.
              animate(y, -nearest * ITEM_H, {
                type: 'spring',
                stiffness: 170,
                damping: 30,
                velocity,
                onComplete: settle,
              })
            }
          }}
        >
          {STRIP.map((letter, i) => {
            const selected = i === MIDDLE + letterIndex
            return (
              <div
                key={i}
                style={{
                  height: ITEM_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, monospace',
                  color: selected ? accent : theme.textDim,
                  textShadow: selected ? `0 0 12px ${accent}` : 'none',
                  userSelect: 'none',
                }}
              >
                {letter}
              </div>
            )
          })}
        </motion.div>
      </div>

      <button
        type="button"
        aria-label="next letter"
        onClick={() => step(1)}
        disabled={disabled}
        style={arrowStyle(accent, disabled)}
      >
        ▼
      </button>
    </div>
  )
}

function arrowStyle(accent: string, disabled: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 26,
    borderRadius: 6,
    border: `1px solid ${theme.panelEdge}`,
    background: 'transparent',
    color: disabled ? theme.textDim : accent,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 12,
    lineHeight: 1,
    padding: 0,
  }
}

function fadeStyle(edge: 'top' | 'bottom'): React.CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_H,
    [edge]: 0,
    zIndex: 1,
    pointerEvents: 'none',
    background:
      edge === 'top'
        ? `linear-gradient(${theme.panel}, transparent)`
        : `linear-gradient(transparent, ${theme.panel})`,
  }
}
