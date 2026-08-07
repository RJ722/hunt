import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { LETTERS, theme, usePrefersReducedMotion } from './theme'

const ITEM_H = 52

interface LetterWheelProps {
  /** Currently selected letter (A–Z). */
  value: string
  onChange: (letter: string) => void
  disabled?: boolean
  /** Glow accent colour. */
  accent?: string
}

/**
 * A vertical A–Z reel. Drag/swipe to spin and it snaps to the nearest letter,
 * like a vault access dial. Also exposes ▲/▼ controls for precise, accessible
 * selection. Emits the selected letter via onChange.
 */
export function LetterWheel({
  value,
  onChange,
  disabled = false,
  accent = theme.cyan,
}: LetterWheelProps) {
  const reduced = usePrefersReducedMotion()
  const index = Math.max(0, LETTERS.indexOf(value.toUpperCase()))
  const y = useMotionValue(-index * ITEM_H)
  const draggingRef = useRef(false)

  // Keep the reel aligned when `value` changes from outside (e.g. reset).
  useEffect(() => {
    if (draggingRef.current) return
    const target = -index * ITEM_H
    if (reduced) {
      y.set(target)
    } else {
      const controls = animate(y, target, {
        type: 'spring',
        stiffness: 500,
        damping: 40,
      })
      return () => controls.stop()
    }
  }, [index, reduced, y])

  const settleTo = (i: number) => {
    const clamped = Math.min(LETTERS.length - 1, Math.max(0, i))
    onChange(LETTERS[clamped])
  }

  const step = (delta: number) => {
    if (disabled) return
    settleTo(index + delta)
  }

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
          height: ITEM_H,
          overflow: 'hidden',
          borderRadius: 10,
          background: theme.panel,
          border: `1px solid ${theme.panelEdge}`,
          boxShadow: `0 0 14px ${accent}44, inset 0 0 18px #0008`,
        }}
      >
        {/* selection frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderTop: `1px solid ${accent}66`,
            borderBottom: `1px solid ${accent}66`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        {/* fade top/bottom */}
        <div style={fadeStyle('top')} />
        <div style={fadeStyle('bottom')} />

        <motion.div
          style={{ y, position: 'absolute', left: 0, right: 0, top: 0 }}
          drag={disabled ? false : 'y'}
          dragConstraints={{
            top: -(LETTERS.length - 1) * ITEM_H,
            bottom: 0,
          }}
          dragElastic={0.08}
          onDragStart={() => {
            draggingRef.current = true
          }}
          onDragEnd={() => {
            draggingRef.current = false
            const nearest = Math.round(-y.get() / ITEM_H)
            settleTo(nearest)
          }}
        >
          {LETTERS.map((letter, i) => (
            <div
              key={letter}
              style={{
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                color: i === index ? accent : theme.textDim,
                textShadow: i === index ? `0 0 12px ${accent}` : 'none',
                userSelect: 'none',
              }}
            >
              {letter}
            </div>
          ))}
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
    height: 14,
    [edge]: 0,
    zIndex: 1,
    pointerEvents: 'none',
    background:
      edge === 'top'
        ? `linear-gradient(${theme.panel}, transparent)`
        : `linear-gradient(transparent, ${theme.panel})`,
  }
}
