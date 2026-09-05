import { SELF } from 'cloudflare:test'
import { expect, it } from 'vitest'

it('responde a checagem de saúde', async () => {
  const resposta = await SELF.fetch('http://local.test/api/saude')

  expect(resposta.status).toBe(200)
  expect(await resposta.json()).toEqual({ ok: true })
})
