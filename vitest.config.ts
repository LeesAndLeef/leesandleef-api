import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: loadEnv('test', process.cwd(), ''),
    fileParallelism: false,
  },
})
