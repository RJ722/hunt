import { load as yamlLoad } from 'js-yaml'
import { tags } from '../data/tags'

export interface Riddle {
  /** Links this riddle to a tag slug in tags.ts. */
  tagId: string
  /** Optional display title. */
  title?: string
  /** The Wordle target word — A–Z letters only, uppercased on load. */
  answer: string
  /** Optional theme/hint shown alongside the puzzle. */
  hint?: string
  /** The clue body (revealed after the puzzle is solved), as markdown/plain text. */
  clue: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

function parseMarkdown(raw: string, path: string): Riddle {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) {
    throw new Error(`Riddle "${path}" is missing YAML frontmatter (--- ... ---).`)
  }

  const data = (yamlLoad(match[1]) ?? {}) as Record<string, unknown>
  const clue = match[2].trim()

  const tagId = data.tagId
  if (typeof tagId !== 'string' || tagId.trim() === '') {
    throw new Error(`Riddle "${path}" is missing a string "tagId".`)
  }

  const answerRaw = data.answer
  if (typeof answerRaw !== 'string' || answerRaw.trim() === '') {
    throw new Error(`Riddle "${path}" is missing a string "answer".`)
  }
  const answer = answerRaw.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(answer)) {
    throw new Error(
      `Riddle "${path}" answer "${answerRaw}" must be letters A–Z only ` +
        `(no spaces, digits, or punctuation) — the input is A–Z letter wheels.`,
    )
  }

  return {
    tagId: tagId.trim(),
    title: typeof data.title === 'string' ? data.title : undefined,
    answer,
    hint: typeof data.hint === 'string' ? data.hint : undefined,
    clue,
  }
}

// Eagerly load every riddle markdown file as a raw string at build time.
const modules = import.meta.glob('../data/riddles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function buildRiddleMap(): Map<string, Riddle> {
  const map = new Map<string, Riddle>()
  for (const [path, raw] of Object.entries(modules)) {
    const riddle = parseMarkdown(raw, path)
    if (map.has(riddle.tagId)) {
      throw new Error(`Duplicate riddle tagId "${riddle.tagId}" (in ${path}).`)
    }
    map.set(riddle.tagId, riddle)
  }

  // Validate that every non-final tag has a matching riddle.
  for (const tag of tags) {
    if (!tag.isFinal && !map.has(tag.slug)) {
      throw new Error(
        `Tag "${tag.slug}" in tags.ts has no matching riddle markdown ` +
          `(expected a file in src/data/riddles with "tagId: ${tag.slug}").`,
      )
    }
  }

  return map
}

const riddleMap = buildRiddleMap()

export function getRiddle(tagId: string): Riddle | undefined {
  return riddleMap.get(tagId)
}
