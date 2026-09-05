import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const migracoes = await readD1Migrations('./migrations')

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          MIGRACOES: migracoes,
          // Par P-256 gerado só pra teste; as chaves de verdade ficam em `.dev.vars`.
          VAPID_PUBLIC: 'BH_uibinWylhnTTWMCplEycYq7bu9fQwcDxnHK6Ow66fCh6YN7k4b6cWFvpupUo4RJd6AusTjmwfHBtI0CwX3Jg',
          VAPID_PRIVATE: 't_hak-wyt8pIXJhoAeV18_DcS2doWvq_T4Bkrcu57Rk',
          VAPID_SUBJECT: 'mailto:renovo@example.com',
        },
      },
    }),
  ],
  test: {
    setupFiles: ['./worker/testes/migrar.ts'],
  },
})
