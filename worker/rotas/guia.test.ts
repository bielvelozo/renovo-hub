import { SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { cookieDe, criarMembro, limparBanco } from '../testes/apoio'

const RAIZ = 'http://local.test'

beforeEach(async () => {
  await limparBanco()
  await criarMembro({ id: 'julia', nome: 'Júlia' })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true })
})

describe('GET /api/guia', () => {
  it('começa sem nada feito e com o guia à mostra', async () => {
    expect(await corpoDe(await pedir('/api/guia', 'julia'))).toEqual({ feitas: [], escondido: false })
  })

  it('exige sessão', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/guia`)).status).toBe(401)
  })
})

describe('POST /api/guia/feitas', () => {
  it('marca a tarefa só pro Membro da sessão', async () => {
    const resposta = await pedir('/api/guia/feitas', 'julia', { tarefa: 'sugerir' })

    expect(resposta.status).toBe(200)
    expect(await corpoDe(resposta)).toEqual({ feitas: ['sugerir'], escondido: false })
    expect(await corpoDe(await pedir('/api/guia', 'marcos'))).toEqual({ feitas: [], escondido: false })
  })

  it('não repete a tarefa marcada duas vezes', async () => {
    await pedir('/api/guia/feitas', 'julia', { tarefa: 'sugerir' })
    await pedir('/api/guia/feitas', 'julia', { tarefa: 'catalogo' })
    const resposta = await pedir('/api/guia/feitas', 'julia', { tarefa: 'sugerir' })

    expect(await corpoDe(resposta)).toEqual({ feitas: ['catalogo', 'sugerir'], escondido: false })
  })

  it('recusa tarefa que o guia não tem', async () => {
    expect((await pedir('/api/guia/feitas', 'julia', { tarefa: 'voar' })).status).toBe(422)
  })
})

describe('POST /api/guia/escondido', () => {
  it('esconde e volta a mostrar o guia do Início', async () => {
    expect(await corpoDe(await pedir('/api/guia/escondido', 'julia', { escondido: true }))).toEqual({
      feitas: [],
      escondido: true,
    })
    expect(await corpoDe(await pedir('/api/guia/escondido', 'julia', { escondido: false }))).toEqual({
      feitas: [],
      escondido: false,
    })
  })

  it('recusa valor que não é sim ou não', async () => {
    expect((await pedir('/api/guia/escondido', 'julia', { escondido: 'talvez' })).status).toBe(422)
  })
})

async function pedir(caminho: string, quem: string, corpo?: unknown): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { cookie: await cookieDe(quem), 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
}

async function corpoDe<T = unknown>(resposta: Response): Promise<T> {
  return resposta.json<T>()
}
