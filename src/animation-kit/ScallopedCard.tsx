import { useId } from 'react'
import type { ReactNode } from 'react'
import { theme } from './theme'

const TILE = 28 // scallop tile width
const R = 14 // scallop radius (== TILE / 2 so bumps kiss)

interface ScallopedCardProps {
  children: ReactNode
  /** Colour of the dashed "stitch" border. */
  stitch?: string
  /** Card surface colour. */
  surface?: string
  maxWidth?: number
  style?: React.CSSProperties
}

/**
 * A cream scrapbook page with scalloped top & bottom edges, a dashed stitch
 * border, and a little washi-tape accent. The scallops + body share one silhouette
 * so a single `drop-shadow` wraps the whole shape softly.
 */
export function ScallopedCard({
  children,
  stitch = theme.sage,
  surface = theme.panel,
  maxWidth = 460,
  style,
}: ScallopedCardProps) {
  const id = useId().replace(/[:]/g, '')
  const topId = `scallop-top-${id}`
  const botId = `scallop-bot-${id}`

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        filter: 'drop-shadow(0 10px 22px rgba(120, 88, 60, 0.18))',
        ...style,
      }}
    >
      {/* washi tape */}
      <div
        style={{
          position: 'absolute',
          top: -18,
          left: 30,
          width: 74,
          height: 26,
          background: `${theme.lavender}cc`,
          transform: 'rotate(-7deg)',
          borderRadius: 3,
          zIndex: 3,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
        }}
      />

      {/* top scallop edge (domes pointing up) */}
      <svg
        width="100%"
        height={R}
        aria-hidden="true"
        style={{ display: 'block', position: 'relative', top: 1, zIndex: 0 }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={topId} width={TILE} height={R} patternUnits="userSpaceOnUse">
            <circle cx={R} cy={R} r={R} fill={surface} />
          </pattern>
        </defs>
        <rect width="100%" height={R} fill={`url(#${topId})`} />
      </svg>

      {/* body */}
      <div
        style={{
          position: 'relative',
          background: surface,
          padding: '30px 26px',
          zIndex: 1,
        }}
      >
        {/* dashed stitch border */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 10,
            border: `2px dashed ${stitch}`,
            borderRadius: 16,
            opacity: 0.55,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </div>

      {/* bottom scallop edge (domes pointing down) */}
      <svg
        width="100%"
        height={R}
        aria-hidden="true"
        style={{ display: 'block', position: 'relative', top: -1, zIndex: 0 }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={botId} width={TILE} height={R} patternUnits="userSpaceOnUse">
            <circle cx={R} cy={0} r={R} fill={surface} />
          </pattern>
        </defs>
        <rect width="100%" height={R} fill={`url(#${botId})`} />
      </svg>
    </div>
  )
}
