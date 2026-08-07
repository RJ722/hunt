export interface TagEntry {
  /** Matches the slug written into the physical NFC tag's URL (#/t/<slug>). */
  slug: string
  /** Exactly one tag should set this true — tapping it ends the hunt. */
  isFinal?: boolean
  /** Congratulatory message for the final screen. Only used when isFinal. */
  completionMessage?: string
}

/**
 * The single source of truth for every NFC tag in the hunt.
 *
 * To add a stop: add a `{ slug: '...' }` entry here and create a matching
 * riddle markdown file in ./riddles with the same `tagId`. Slugs are arbitrary
 * strings you choose when writing the tag (they are not the tag's hardware
 * serial). Keep them short and URL-safe.
 */
export const tags: TagEntry[] = [
  { slug: 'start' },
  { slug: 'library' },
  { slug: 'garden' },
  {
    slug: 'vault',
    isFinal: true,
    completionMessage:
      'Every treat sniffed out, every riddle solved. Happy birthday, Kat — you clever, curious thing. 🎂🐾',
  },
]

export function getTag(slug: string): TagEntry | undefined {
  return tags.find((t) => t.slug === slug)
}
