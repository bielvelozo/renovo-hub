import type { D1Migration } from '@cloudflare/vitest-pool-workers'

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database
      MIGRACOES: D1Migration[]
      VAPID_PUBLIC: string
      VAPID_PRIVATE: string
      VAPID_SUBJECT: string
    }
  }
}
