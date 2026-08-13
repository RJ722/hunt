import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { LETTERS, theme, usePrefersReducedMotion } from './theme'

// Base (scale === 1) pixel metrics — see `scale` prop below for how longer
// answers shrink every wheel uniformly to keep the whole row on-screen.
const ITEM_H_BASE = 50
export const WHEEL_W_BASE = 58
const COPIES = 3
const N = LETTERS.length // 26
const MIDDLE = N // index where the middle alphabet copy starts

const mod = (n: number, m: number) => ((n % m) + m) % m
// Seconds of coasting projected from the release velocity — higher = longer flick.
const MOMENTUM = 0.28
// Wheel/trackpad delta needed to advance one letter on desktop.
const WHEEL_STEP = 46
// Never shrink so far that letters stop being legible/tappable.
export const MIN_SCALE = 0.5

// Three stacked copies of the alphabet so the reel can wrap seamlessly. After
// every interaction we snap back into the middle copy (invisible, same letter),
// leaving a full alphabet of headroom in both directions.
const STRIP = Array.from({ length: COPIES * N }, (_, i) => LETTERS[i % N])

interface LetterWheelProps {
  value: string
  onChange: (letter: string) => void
  disabled?: boolean
  accent?: string
  /** When true, spin to a random letter once on mount to teach the gesture. */
  demo?: boolean
  /** Called once when the *player* (not the demo animation) drags/scrolls this wheel. */
  onUserSpin?: () => void
  /**
   * Uniform size multiplier (0.5–1), so longer answers (more wheels in a row)
   * shrink to fit the available width instead of overflowing it. Defaults to
   * full size.
   */
  scale?: number
}

/**
 * A circular vertical A–Z letter reel, cradled in a paw-print badge. Drag/
 * swipe, flick, or scroll (desktop) to spin; past 'A' wraps to 'Z' and past
 * 'Z' wraps to 'A'. The selected letter sits large and glowing; neighbours
 * dim away.
 */
export function LetterWheel({
  value,
  onChange,
  disabled = false,
  accent = theme.peach,
  demo = false,
  onUserSpin,
  scale = 1,
}: LetterWheelProps) {
  const reduced = usePrefersReducedMotion()
  const clampedScale = Math.min(1, Math.max(MIN_SCALE, scale))
  const itemH = Math.round(ITEM_H_BASE * clampedScale)
  const wheelW = Math.round(WHEEL_W_BASE * clampedScale)
  // Read from a ref inside effects/closures that don't want to re-run every
  // time `scale` changes (mount-only demo spin, native wheel listener).
  const itemHRef = useRef(itemH)
  itemHRef.current = itemH
  const letterIndex = Math.max(0, LETTERS.indexOf(value.toUpperCase()))
  // The selection lives in the middle copy so there is room to wrap either way.
  const y = useMotionValue(-(MIDDLE + letterIndex) * itemH)
  const busy = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const demoAnim = useRef<{ stop: () => void } | null>(null)

  // Which strip row is currently centered — drives the "pop" as the reel moves.
  const [centerRow, setCenterRow] = useState(MIDDLE + letterIndex)
  useMotionValueEvent(y, 'change', (latest) => {
    const row = Math.round(-latest / itemHRef.current)
    setCenterRow((prev) => (prev === row ? prev : row))
  })

  // Keep live copies of props so the native wheel listener need not re-bind.
  const onChangeRef = useRef(onChange)
  const onUserSpinRef = useRef(onUserSpin)
  const disabledRef = useRef(disabled)
  onChangeRef.current = onChange
  onUserSpinRef.current = onUserSpin
  disabledRef.current = disabled

  // Re-align if `value` (or the size scale) changes from outside while idle.
  useEffect(() => {
    if (busy.current) return
    y.set(-(MIDDLE + letterIndex) * itemH)
  }, [letterIndex, itemH, y])

  const settleTo = (li: number) => {
    y.set(-(MIDDLE + li) * itemHRef.current) // invisible: same letter, middle copy
    busy.current = false
  }

  // ── One-time onboarding: spin to a random letter to teach the gesture ─────
  // Travel distance and duration are both 3x a single "step" spin, so every
  // wheel visibly whirls through several letters before settling — long
  // enough to register as "look, these spin" without dragging the load out.
  useEffect(() => {
    if (!demo || reduced || disabled) return
    const steps = (7 + Math.floor(Math.random() * 11)) * 3 // 21..51 letters of travel
    const startRow = Math.round(-y.get() / itemHRef.current)
    const targetRow = startRow + steps
    const li = mod(targetRow, N)
    busy.current = true
    const controls = animate(y, -targetRow * itemHRef.current, {
      duration: 1.15 * 3,
      ease: [0.15, 0.85, 0.25, 1], // quick spin, gentle settle
      onComplete: () => {
        onChangeRef.current(LETTERS[li])
        settleTo(li)
      },
    })
    demoAnim.current = controls
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Desktop mouse-wheel / trackpad stepping ──────────────────────────────
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    let acc = 0
    let idx: number | null = null
    let timer: number | undefined

    const onWheel = (e: WheelEvent) => {
      if (disabledRef.current) return
      e.preventDefault() // don't let the page scroll while spinning a reel
      demoAnim.current?.stop()
      acc += e.deltaY
      if (Math.abs(acc) < WHEEL_STEP) return
      const dir = acc > 0 ? 1 : -1
      acc = 0
      busy.current = true
      onUserSpinRef.current?.() // real user gesture, distinct from the demo auto-spin
      if (idx === null) idx = Math.round(-y.get() / itemHRef.current)
      idx += dir
      const li = mod(idx, N)
      onChangeRef.current(LETTERS[li])
      animate(y, -idx * itemHRef.current, { type: 'spring', stiffness: 520, damping: 44 })

      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const finalLi = mod(idx!, N)
        idx = null
        settleTo(finalLi)
      }, 220)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: disabled ? 0.9 : 1,
      }}
    >
      <div
        ref={viewportRef}
        role="spinbutton"
        aria-valuetext={value}
        aria-label="letter"
        style={{
          position: 'relative',
          width: wheelW,
          height: itemH * 3,
          overflow: 'hidden',
          borderRadius: '40% 40% 40% 40% / 30% 30% 30% 30%',
          background: theme.panelSoft,
          border: `2px solid ${theme.sageSoft}`,
          boxShadow: `inset 0 2px 6px ${theme.panelEdge}66`,
          touchAction: 'none',
        }}
      >
        {/* paw-print badge behind the centered letter */}
        <PawBadge accent={accent} size={Math.round(46 * clampedScale)} />

        <div style={fadeStyle('top', itemH)} />
        <div style={fadeStyle('bottom', itemH)} />

        <motion.div
          // `top: itemH` centers the selected item in the middle row.
          style={{ y, position: 'absolute', left: 0, right: 0, top: itemH, touchAction: 'none' }}
          drag={disabled ? false : 'y'}
          dragConstraints={{ top: -(STRIP.length - 1) * itemH, bottom: 0 }}
          dragElastic={0.06}
          dragMomentum={false}
          onDragStart={() => {
            demoAnim.current?.stop()
            busy.current = true
            onUserSpin?.() // real user gesture, distinct from the demo auto-spin
          }}
          onDragEnd={(_e, info) => {
            const current = y.get()
            const velocity = info.velocity.y // px/s (up = negative)
            // Project where the flick would coast to, so a fast swipe carries
            // through several letters instead of stopping under the finger.
            const projected = current + velocity * MOMENTUM
            const rawNearest = Math.round(-projected / itemH)
            const nearest = Math.min(Math.max(rawNearest, 0), STRIP.length - 1)
            const li = mod(nearest, N)
            onChange(LETTERS[li])
            if (reduced) {
              settleTo(li)
            } else {
              animate(y, -nearest * itemH, {
                type: 'spring',
                stiffness: 170,
                damping: 30,
                velocity,
                onComplete: () => settleTo(li),
              })
            }
          }}
        >
          {STRIP.map((letter, i) => {
            const dist = Math.abs(i - centerRow)
            const selected = dist === 0
            return (
              <div
                key={i}
                style={{
                  height: itemH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Baloo 2", ui-monospace, monospace',
                  fontSize: Math.round((selected ? 30 : 19) * clampedScale),
                  fontWeight: selected ? 800 : 600,
                  color: selected ? theme.text : theme.textDim,
                  opacity: selected ? 1 : dist === 1 ? 0.5 : 0.28,
                  textShadow: selected ? `0 1px 0 ${theme.cream}, 0 0 14px ${accent}88` : 'none',
                  transition: 'font-size 0.12s ease, opacity 0.12s ease',
                  userSelect: 'none',
                }}
              >
                {letter}
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

/** A soft paw-print badge that haloes the centered letter. */
function PawBadge({ accent, size = 46 }: { accent: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 46 46"
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        opacity: 0.9,
      }}
    >
      <g fill={theme.peachSoft} stroke={accent} strokeWidth="1.5">
        <ellipse cx="23" cy="27" rx="12" ry="10" />
        <ellipse cx="12" cy="16" rx="4.2" ry="5.5" />
        <ellipse cx="20" cy="12" rx="4.2" ry="5.5" />
        <ellipse cx="28" cy="12" rx="4.2" ry="5.5" />
        <ellipse cx="35" cy="16" rx="4.2" ry="5.5" />
      </g>
    </svg>
  )
}

function fadeStyle(edge: 'top' | 'bottom', itemH: number): React.CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    height: itemH,
    [edge]: 0,
    zIndex: 2,
    pointerEvents: 'none',
    background:
      edge === 'top'
        ? `linear-gradient(${theme.panelSoft}, ${theme.panelSoft}00)`
        : `linear-gradient(${theme.panelSoft}00, ${theme.panelSoft})`,
  }
}
