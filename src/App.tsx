import { lazy, Suspense } from 'react'
import { useRoute } from './lib/router'
import { RiddleScreen } from './screens/RiddleScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'
import { theme } from './animation-kit/theme'

// Dev-only harness: lazy so it forms its own chunk and never ships to prod.
const Playground = lazy(() =>
  import('./animation-kit/playground/Playground').then((m) => ({
    default: m.Playground,
  })),
)

export default function App() {
  const route = useRoute()

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: `radial-gradient(circle at 50% 0%, ${theme.panel}, ${theme.bg} 70%)`,
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      {route.kind === 'tag' && <RiddleScreen key={route.slug} slug={route.slug} />}
      {route.kind === 'home' && <NotFoundScreen reason="home" />}
      {route.kind === 'notfound' && <NotFoundScreen reason="unknown" />}
      {route.kind === 'playground' && import.meta.env.DEV && (
        <Suspense fallback={<div style={{ color: theme.textDim }}>Loading playground…</div>}>
          <Playground />
        </Suspense>
      )}
    </div>
  )
}
