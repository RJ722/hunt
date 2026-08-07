import { useEffect, useState } from 'react'

/** Neon/cyberpunk palette shared across the animation kit. */
export const theme = {
  bg: '#05060f',
  panel: '#0b0f1f',
  panelEdge: '#1b2440',
  cyan: '#22e6ff',
  magenta: '#ff2bd6',
  purple: '#a855f7',
  green: '#39ff14',
  amber: '#ffb300',
  textDim: '#7c86a8',
  text: '#e6f0ff',
} as const

/** True when the user has requested reduced motion. Re-evaluates on change. */
export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
