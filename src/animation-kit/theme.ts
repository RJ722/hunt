import { useEffect, useState } from 'react'

/**
 * Cozy storybook palette — a cat exploring a garden of birthday treats.
 * Warm cream/blush surfaces with soft peach, sage, and lavender accents.
 * The `bg / panel / panelEdge / text / textDim` names are kept stable so the
 * rest of the app keeps working; accent names are semantic to this theme.
 */
export const theme = {
  // Surfaces (warm, never harsh-dark)
  bg: '#f7ecdc', // warm cream base
  panel: '#fffaf2', // scrapbook page
  panelSoft: '#fff3e3', // blush-cream inset
  panelEdge: '#e8d3b8', // soft tan stitch/edge
  // Ink (warm brown — never pure black)
  text: '#5f4a39',
  textDim: '#a5917f',
  // Accents
  peach: '#ff9f7e',
  peachSoft: '#ffd8c6',
  sage: '#7fb185',
  sageSoft: '#cbe6cd',
  lavender: '#b0a1e3',
  lavenderSoft: '#e4dbf7',
  gold: '#f3b53f',
  cream: '#fff3e0',
  blush: '#f6c6ce',
  // Gentle negatives (wrong-guess feedback) — soft terracotta, never harsh red.
  rose: '#e08877',
  roseSoft: '#f6c9be',
} as const

/** Font stacks (loaded via Google Fonts in index.html). */
export const fonts = {
  display: '"Baloo 2", "Quicksand", system-ui, sans-serif',
  body: '"Quicksand", system-ui, sans-serif',
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
