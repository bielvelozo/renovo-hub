import { Hono } from 'hono'
import type { Ambiente, Contexto } from './tipos'

const app = new Hono<Contexto>()

app.get('/api/saude', (c) => c.json({ ok: true }))

export default {
  fetch: app.fetch,
  async scheduled() {},
} satisfies ExportedHandler<Ambiente>
