import { load as yamlLoad } from 'js-yaml'
import { tags } from '../data/tags'

export interface Riddle {
  /** Links this riddle to a tag slug in tags.ts. */
  tagId: string
  /** Optional display title. */
  title?: string
  /** The Wordle target word — A–Z letters (spaces allowed), uppercased on load. */
  answer: string
  /** Optional theme/hint shown alongside the puzzle. */
  hint?: string
  /** Optional resolved URL of an artifact image shown with the puzzle. */
  artifactSrc?: string
  /** The clue body (revealed after the puzzle is solved), as markdown/plain text. */
  clue: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

// Eagerly resolve every artifact image to a URL at build time.
const artifactUrls = import.meta.glob('../data/artifacts/*.{svg,png,jpg,jpeg,webp}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

function resolveArtifact(name: string, path: string): string {
  const match = Object.entries(artifactUrls).find(([p]) =>
    p.endsWith(`/${name}`),
  )
  if (!match) {
    const available = Object.keys(artifactUrls)
      .map((p) => p.split('/').pop())
      .join(', ')
    throw new Error(
      `Riddle "${path}" references artifact "${name}" which does not exist ` +
        `in src/data/artifacts (available: ${available}).`,
    )
  }
  return match[1]
}

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
  // Collapse any run of whitespace to a single space, then uppercase.
  const answer = answerRaw.trim().replace(/\s+/g, ' ').toUpperCase()
  if (!/^[A-Z]+( [A-Z]+)*$/.test(answer)) {
    throw new Error(
      `Riddle "${path}" answer "${answerRaw}" must be letters A–Z, with ` +
        `single spaces between words only (no digits or punctuation) — the ` +
        `input is A–Z letter wheels.`,
    )
  }

  let artifactSrc: string | undefined
  if (data.artifact !== undefined) {
    if (typeof data.artifact !== 'string' || data.artifact.trim() === '') {
      throw new Error(`Riddle "${path}" has an invalid "artifact" (must be a filename).`)
    }
    artifactSrc = resolveArtifact(data.artifact.trim(), path)
  }

  return {
    tagId: tagId.trim(),
    title: typeof data.title === 'string' ? data.title : undefined,
    answer,
    hint: typeof data.hint === 'string' ? data.hint : undefined,
    artifactSrc,
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
