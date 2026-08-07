import { theme } from '../animation-kit/theme'

interface NotFoundScreenProps {
  /** 'home' = bare URL (no tag yet); 'unknown' = slug not recognized. */
  reason: 'home' | 'unknown'
}

export function NotFoundScreen({ reason }: NotFoundScreenProps) {
  const home = reason === 'home'
  return (
    <div
      style={{
        textAlign: 'center',
        maxWidth: 420,
        margin: '0 auto',
        padding: '0 20px',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <div
        style={{
          fontSize: 40,
          marginBottom: 16,
          color: home ? theme.cyan : theme.magenta,
          textShadow: `0 0 18px ${home ? theme.cyan : theme.magenta}`,
        }}
      >
        {home ? '📡' : '⚠'}
      </div>
      <h1
        style={{
          fontSize: 20,
          letterSpacing: 3,
          color: theme.text,
          margin: '0 0 12px',
        }}
      >
        {home ? 'NFCunt' : 'SIGNAL LOST'}
      </h1>
      <p style={{ color: theme.textDim, fontSize: 15, lineHeight: 1.6 }}>
        {home
          ? 'Tap an NFC tag to begin the hunt.'
          : "Hmm, this tag isn't recognized. Double-check the tag or find another one to scan."}
      </p>
    </div>
  )
}
