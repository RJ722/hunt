import { describe, expect, it } from 'vitest'
import { evaluateGuess, isSolved } from './lib/wordle'

describe('evaluateGuess', () => {
  it('marks a fully correct guess', () => {
    expect(evaluateGuess('OWLET', 'OWLET')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('marks all-absent when no letters overlap', () => {
    expect(evaluateGuess('BXYZ', 'MOON'.slice(0, 4))).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
    ])
  })

  it('marks a present (right letter, wrong spot)', () => {
    // answer CAT, guess TAC -> T present, A correct, C present
    expect(evaluateGuess('TAC', 'CAT')).toEqual(['present', 'correct', 'present'])
  })

  it('is case-insensitive', () => {
    expect(evaluateGuess('owlet', 'OWLET').every((s) => s === 'correct')).toBe(true)
  })

  describe('duplicate-letter handling', () => {
    it('does not over-credit a duplicate guess letter when answer has only one', () => {
      // answer ABIDE (one E), guess EERIE (three Es).
      // Position-by-position: E,E,R,I,E vs A,B,I,D,E
      // index4 E === E -> correct. That consumes the single E.
      // No other E should be marked present.
      const res = evaluateGuess('EERIE', 'ABIDE')
      expect(res[4]).toBe('correct')
      expect(res[0]).toBe('absent')
      expect(res[1]).toBe('absent')
      expect(res[3]).toBe('present') // guess I matches the I in answer ABIDE
    })

    it('credits exactly the available copies as present', () => {
      // answer LLAMA, guess ALOLA
      // answer letters: L L A M A
      // guess:          A L O L A
      // idx0 A vs L: not correct; A present? answer has A(idx2), A(idx4) => yes
      // idx1 L vs L: correct (consumes one L)
      // idx2 O vs A: absent
      // idx3 L vs M: present? one L remains in answer => present
      // idx4 A vs A: correct
      expect(evaluateGuess('ALOLA', 'LLAMA')).toEqual([
        'present',
        'correct',
        'absent',
        'present',
        'correct',
      ])
    })

    it('prefers correct positions over present when consuming letters', () => {
      // answer SPEED, guess ERASE
      // answer: S P E E D
      // guess:  E R A S E
      // idx0 E vs S: E present? answer has E,E => yes
      // idx1 R vs P: absent
      // idx2 A vs E: absent
      // idx3 S vs E: S present? answer has S(idx0) => yes
      // idx4 E vs D: E present? one E copy remains => present
      expect(evaluateGuess('ERASE', 'SPEED')).toEqual([
        'present',
        'absent',
        'absent',
        'present',
        'present',
      ])
    })
  })
})

describe('isSolved', () => {
  it('true only when all correct', () => {
    expect(isSolved(['correct', 'correct'])).toBe(true)
    expect(isSolved(['correct', 'present'])).toBe(false)
    expect(isSolved([])).toBe(false)
  })
})
