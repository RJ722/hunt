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
    expect(screen.getByText(/Tap an NFC tag to begin/i)).toBeTruthy()
  })

  it('renders the Wordle gate for a known tag', () => {
    setHash('#/t/start')
    render(<App />)
    expect(screen.getByText(/ACCESS PANEL/i)).toBeTruthy()
    // 5 letter wheels for RELAY.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5)
  })

  it('renders the completion screen for the final tag', () => {
    setHash('#/t/vault')
    render(<App />)
    expect(screen.getByText(/HUNT COMPLETE/i)).toBeTruthy()
    expect(screen.getByText(/Made with .* by RJ722/i)).toBeTruthy()
  })

  it('renders the not-found screen for an unknown tag', () => {
    setHash('#/t/does-not-exist')
    render(<App />)
    expect(screen.getByText(/SIGNAL LOST/i)).toBeTruthy()
  })
})
