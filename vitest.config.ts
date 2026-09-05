import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const migracoes = await readD1Migrations('./migrations')

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: { bindings: { MIGRACOES: migracoes } },
    }),
  ],
  test: {
    setupFiles: ['./worker/testes/migrar.ts'],
  },
})
