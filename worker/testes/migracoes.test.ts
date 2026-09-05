import { env } from 'cloudflare:test'
import { expect, it } from 'vitest'

it('aplica as migrations antes dos testes', async () => {
  const { results } = await env.DB.prepare(
    "select name from sqlite_master where type = 'table' order by name",
  ).all<{ name: string }>()

  expect(results.map((linha) => linha.name)).toContain('membros')
})
