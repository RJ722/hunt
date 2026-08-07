import { motion } from 'motion/react'
import { fonts, theme } from '../animation-kit/theme'
import homeKat from '../animation-kit/assets/home-kat.svg?url'
import lostKat from '../animation-kit/assets/lost-kat.svg?url'

interface NotFoundScreenProps {
  /** 'home' = bare URL (no tag yet); 'unknown' = slug not recognized. */
  reason: 'home' | 'unknown'
}

export function NotFoundScreen({ reason }: NotFoundScreenProps) {
  const home = reason === 'home'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        textAlign: 'center',
        maxWidth: 420,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <img
        src={home ? homeKat : lostKat}
        alt={home ? 'Kat waving hello' : 'A puzzled Kat'}
        width={132}
        height={132}
        style={{ width: 132, height: 132, objectFit: 'contain' }}
      />
      <h1
        style={{
          fontFamily: fonts.display,
          fontSize: 26,
          fontWeight: 800,
          color: theme.text,
          margin: 0,
        }}
      >
        {home ? "Kat's Birthday Hunt 🐾" : 'Hmm, no treats here'}
      </h1>
      <p
        style={{
          fontFamily: fonts.body,
          color: theme.textDim,
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {home
          ? "Tap a paw-print tag to sniff out Kat's first birthday treat!"
          : "This isn't one of Kat's spots. Double-check the tag, or find another paw print to boop."}
      </p>
    </motion.div>
  )
}
