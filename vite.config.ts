import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/app-Rating-Web-app/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
