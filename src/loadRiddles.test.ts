import { describe, expect, it } from 'vitest'
import { getRiddle } from './lib/loadRiddles'
import { tags } from './data/tags'

describe('loadRiddles', () => {
  it('loads and validates all non-final tags without throwing', () => {
    for (const tag of tags) {
      if (tag.isFinal) continue
      const riddle = getRiddle(tag.slug)
      expect(riddle, `riddle for ${tag.slug}`).toBeDefined()
      expect(riddle!.answer).toMatch(/^[A-Z]+$/)
      expect(riddle!.clue.length).toBeGreaterThan(0)
    }
  })

  it('exactly one final tag exists', () => {
    expect(tags.filter((t) => t.isFinal)).toHaveLength(1)
  })
})
