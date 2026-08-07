import { useEffect, useState } from 'react'

export type Route =
  | { kind: 'tag'; slug: string }
  | { kind: 'playground' }
  | { kind: 'home' }
  | { kind: 'notfound' }

/**
 * Parse the current location.hash into a Route.
 *
 * Supported hashes:
 *   #/t/<slug>     -> a tag stop
 *   #/playground   -> dev-only animation harness (ignored in production builds)
 *   (empty) / #/   -> home ("tap a tag to begin")
 *   anything else  -> notfound
 */
export function parseHash(hash: string): Route {
  // Strip leading '#', then leading '/'.
  const path = hash.replace(/^#/, '').replace(/^\//, '')

  if (path === '' ) return { kind: 'home' }

  if (import.meta.env.DEV && path === 'playground') {
    return { kind: 'playground' }
  }

  const tagMatch = path.match(/^t\/([^/]+)\/?$/)
  if (tagMatch) {
    return { kind: 'tag', slug: decodeURIComponent(tagMatch[1]) }
  }

  return { kind: 'notfound' }
}

/** React hook that returns the current Route and re-renders on hashchange. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
