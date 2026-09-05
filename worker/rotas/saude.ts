import { Hono } from 'hono'
import type { Contexto } from '../tipos'

export const saude = new Hono<Contexto>()

saude.get('/api/saude', (c) => c.json({ ok: true }))
