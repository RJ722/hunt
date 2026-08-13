import { describe, expect, it } from 'vitest'
import { getRiddle } from './lib/loadRiddles'
import { tags } from './data/tags'

describe('loadRiddles', () => {
  it('loads and validates all non-final tags without throwing', () => {
    for (const tag of tags) {
      if (tag.isFinal) continue
      const riddle = getRiddle(tag.slug)
      expect(riddle, `riddle for ${tag.slug}`).toBeDefined()
      expect(riddle!.answer).toMatch(/^[A-Z]+( [A-Z]+)*$/)
      expect(riddle!.clue.length).toBeGreaterThan(0)
    }
  })

  it('exactly one final tag exists', () => {
    expect(tags.filter((t) => t.isFinal)).toHaveLength(1)
  })

  it('supports spaces in an answer (anteroom -> "TEA TIME")', () => {
    const riddle = getRiddle('anteroom')
    expect(riddle?.answer).toBe('TEA TIME')
  })

  it('resolves artifact frontmatter to a URL', () => {
    const riddle = getRiddle('threshold')
    expect(typeof riddle?.artifactSrc).toBe('string')
    // May be a hashed URL in build or an inlined data URI under Vitest.
    expect(riddle!.artifactSrc!.length).toBeGreaterThan(0)
  })
})
