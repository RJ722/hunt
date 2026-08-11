/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is '/' because the site is served from a custom domain (hunt.onlyfork.at)
// at the domain root. If you ever move back to <user>.github.io/<repo>/ without
// a custom domain, change this to '/<repo-name>/'.
// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
