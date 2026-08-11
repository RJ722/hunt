// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'

beforeAll(() => {
  // jsdom lacks matchMedia; the animation kit uses it for reduced-motion.
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
})

afterEach(cleanup)

function setHash(hash: string) {
  window.location.hash = hash
}

describe('App smoke render', () => {
  it('renders the home fallback on a bare URL', () => {
    setHash('')
    render(<App />)
    expect(screen.getByText(/Kat's Birthday Hunt/i)).toBeTruthy()
  })

  it('renders the Wordle gate for a known tag', () => {
    setHash('#/t/start')
    render(<App />)
    expect(screen.getByText(/Spin the petals/i)).toBeTruthy()
    // 5 letter wheels for RELAY.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5)
    // Artifact character is rendered.
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('renders fixed gaps for spaces (garden -> "IN BLOOM" = 7 wheels)', () => {
    setHash('#/t/garden')
    render(<App />)
    // "IN BLOOM" has 7 letters + 1 space; the space is not a wheel.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
  })

  it('renders the completion screen for the final tag', () => {
    setHash('#/t/vault')
    render(<App />)
    expect(screen.getByText(/Kat found it/i)).toBeTruthy()
    expect(screen.getByText(/Made with .* by RJ722/i)).toBeTruthy()
  })

  it('renders the not-found screen for an unknown tag', () => {
    setHash('#/t/does-not-exist')
    render(<App />)
    expect(screen.getByText(/no treats here/i)).toBeTruthy()
  })
})
