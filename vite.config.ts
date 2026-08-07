/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages repo path (https://<user>.github.io/nfcunt/).
// If you later move to a custom domain, change this to '/'.
// https://vite.dev/config/
export default defineConfig({
  base: '/nfcunt/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
