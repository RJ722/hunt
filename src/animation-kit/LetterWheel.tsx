import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { LETTERS, theme, usePrefersReducedMotion } from './theme'

const ITEM_H = 50
const COPIES = 3
const N = LETTERS.length // 26
const MIDDLE = N // index where the middle alphabet copy starts

const mod = (n: number, m: number) => ((n % m) + m) % m
// Seconds of coasting projected from the release velocity — higher = longer flick.
const MOMENTUM = 0.28
// Wheel/trackpad delta needed to advance one letter on desktop.
const WHEEL_STEP = 46

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
}

/**
 * A circular vertical A–Z petal reel. Drag/swipe, flick, or scroll (desktop)
 * to spin; past 'A' wraps to 'Z' and past 'Z' wraps to 'A'. The selected letter
 * sits large and glowing inside a paw-print badge; neighbours dim away.
 */
export function LetterWheel({
  value,
  onChange,
  disabled = false,
  accent = theme.peach,
  demo = false,
}: LetterWheelProps) {
  const reduced = usePrefersReducedMotion()
  const letterIndex = Math.max(0, LETTERS.indexOf(value.toUpperCase()))
  // The selection lives in the middle copy so there is room to wrap either way.
  const y = useMotionValue(-(MIDDLE + letterIndex) * ITEM_H)
  const busy = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const demoAnim = useRef<{ stop: () => void } | null>(null)

  // Which strip row is currently centered — drives the "pop" as the reel moves.
  const [centerRow, setCenterRow] = useState(MIDDLE + letterIndex)
  useMotionValueEvent(y, 'change', (latest) => {
    const row = Math.round(-latest / ITEM_H)
    setCenterRow((prev) => (prev === row ? prev : row))
  })

  // Keep live copies of props so the native wheel listener need not re-bind.
  const onChangeRef = useRef(onChange)
  const disabledRef = useRef(disabled)
  onChangeRef.current = onChange
  disabledRef.current = disabled

  // Re-align if `value` is changed from outside (e.g. reset / reveal) while idle.
  useEffect(() => {
    if (busy.current) return
    y.set(-(MIDDLE + letterIndex) * ITEM_H)
  }, [letterIndex, y])

  const settleTo = (li: number) => {
    y.set(-(MIDDLE + li) * ITEM_H) // invisible: same letter, middle copy
    busy.current = false
  }

  // ── One-time onboarding: spin to a random letter to teach the gesture ─────
  useEffect(() => {
    if (!demo || reduced || disabled) return
    const steps = 7 + Math.floor(Math.random() * 11) // 7..17 letters of travel
    const startRow = Math.round(-y.get() / ITEM_H)
    const targetRow = startRow + steps
    const li = mod(targetRow, N)
    busy.current = true
    const controls = animate(y, -targetRow * ITEM_H, {
      duration: 1.15,
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
      if (idx === null) idx = Math.round(-y.get() / ITEM_H)
      idx += dir
      const li = mod(idx, N)
      onChangeRef.current(LETTERS[li])
      animate(y, -idx * ITEM_H, { type: 'spring', stiffness: 520, damping: 44 })

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
          width: 58,
          height: ITEM_H * 3,
          overflow: 'hidden',
          borderRadius: '40% 40% 40% 40% / 30% 30% 30% 30%',
          background: theme.panelSoft,
          border: `2px solid ${theme.sageSoft}`,
          boxShadow: `inset 0 2px 6px ${theme.panelEdge}66`,
          touchAction: 'none',
        }}
      >
        {/* paw-print badge behind the centered letter */}
        <PawBadge accent={accent} />

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
            demoAnim.current?.stop()
            busy.current = true
          }}
          onDragEnd={(_e, info) => {
            const current = y.get()
            const velocity = info.velocity.y // px/s (up = negative)
            // Project where the flick would coast to, so a fast swipe carries
            // through several letters instead of stopping under the finger.
            const projected = current + velocity * MOMENTUM
            const rawNearest = Math.round(-projected / ITEM_H)
            const nearest = Math.min(Math.max(rawNearest, 0), STRIP.length - 1)
            const li = mod(nearest, N)
            onChange(LETTERS[li])
            if (reduced) {
              settleTo(li)
            } else {
              animate(y, -nearest * ITEM_H, {
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
                  height: ITEM_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Baloo 2", ui-monospace, monospace',
                  fontSize: selected ? 30 : 19,
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
function PawBadge({ accent }: { accent: string }) {
  return (
    <svg
      width="46"
      height="46"
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

function fadeStyle(edge: 'top' | 'bottom'): React.CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_H,
    [edge]: 0,
    zIndex: 2,
    pointerEvents: 'none',
    background:
      edge === 'top'
        ? `linear-gradient(${theme.panelSoft}, ${theme.panelSoft}00)`
        : `linear-gradient(${theme.panelSoft}00, ${theme.panelSoft})`,
  }
}
