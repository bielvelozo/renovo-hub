import { SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { cookieDe, criarEscala, criarFormacao, criarFuncao, criarMembro, limparBanco, porNaEquipe } from '../testes/apoio'

const RAIZ = 'http://local.test'

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarFuncao('guitarra', 'instrumentos', 3)
  await criarFuncao('violao', 'instrumentos', 4, 'Violão')
  await criarFuncao('baixo', 'instrumentos', 5)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal', 'violao'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'pedro', nome: 'Pedro', funcoes: ['baixo'] })
  await criarEscala({ id: 'e1', data: '2099-09-13' })
})

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

describe('listar', () => {
  it('lista as Formações com as entradas agrupadas por Membro', async () => {
    await criarFormacao('banda', 'Banda', [
      ['gabriel', 'guitarra'],
      ['pedro', 'baixo'],
      ['marcos', 'violao'],
    ])

    const { formacoes } = await (await pedir('/api/formacoes', 'julia')).json<{
      formacoes: { id: string; nome: string; entradas: { membroId: string; funcoes: string[] }[] }[]
    }>()

    expect(formacoes).toHaveLength(1)
    expect(formacoes[0].nome).toBe('Banda')
    expect(formacoes[0].entradas).toEqual([
      { membroId: 'gabriel', funcoes: ['guitarra'] },
      { membroId: 'marcos', funcoes: ['violao'] },
      { membroId: 'pedro', funcoes: ['baixo'] },
    ])
  })

  it('sem sessão devolve 401', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/formacoes`)).status).toBe(401)
  })
})

describe('salvar a partir da Equipe', () => {
  it('guarda os Membros e Funções da Equipe da Escala', async () => {
    await porNaEquipe('e1', 'marcos', ['vocal', 'violao'], true)
    await porNaEquipe('e1', 'pedro', ['baixo'])

    const resposta = await pedir('/api/formacoes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Banda de domingo', escalaId: 'e1' }),
    })

    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({
      nome: 'Banda de domingo',
      entradas: [
        { membroId: 'marcos', funcoes: ['vocal', 'violao'] },
        { membroId: 'pedro', funcoes: ['baixo'] },
      ],
    })
  })

  it('a marca de Ministro não entra na Formação', async () => {
    await porNaEquipe('e1', 'marcos', ['vocal'], true)

    const formacao = await (
      await pedir('/api/formacoes', 'marcos', {
        method: 'POST',
        body: JSON.stringify({ nome: 'Banda', escalaId: 'e1' }),
      })
    ).json<{ entradas: Record<string, unknown>[] }>()

    expect(formacao.entradas[0]).toEqual({ membroId: 'marcos', funcoes: ['vocal'] })
  })

  it('salva a Formação direto pelas entradas, sem Escala', async () => {
    const resposta = await pedir('/api/formacoes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Banda', entradas: [{ membroId: 'pedro', funcoes: ['baixo'] }] }),
    })

    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({ entradas: [{ membroId: 'pedro', funcoes: ['baixo'] }] })
  })

  it('sem nome devolve 422', async () => {
    const resposta = await pedir('/api/formacoes', 'marcos', { method: 'POST', body: JSON.stringify({}) })

    expect(resposta.status).toBe(422)
  })

  it('Função desconhecida devolve 422', async () => {
    const resposta = await pedir('/api/formacoes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Banda', entradas: [{ membroId: 'pedro', funcoes: ['trombone'] }] }),
    })

    expect(resposta.status).toBe(422)
  })

  it('Membro comum não salva Formação', async () => {
    const resposta = await pedir('/api/formacoes', 'julia', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Banda' }),
    })

    expect(resposta.status).toBe(403)
  })
})

describe('editar', () => {
  it('renomeia a Formação', async () => {
    await criarFormacao('banda', 'Banda', [['pedro', 'baixo']])

    const resposta = await pedir('/api/formacoes/banda', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ nome: 'Banda B' }),
    })

    expect(await resposta.json()).toMatchObject({ nome: 'Banda B', entradas: [{ membroId: 'pedro' }] })
  })

  it('troca as entradas por inteiro', async () => {
    await criarFormacao('banda', 'Banda', [['pedro', 'baixo']])

    const resposta = await pedir('/api/formacoes/banda', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ entradas: [{ membroId: 'gabriel', funcoes: ['guitarra'] }] }),
    })

    expect(await resposta.json()).toMatchObject({ entradas: [{ membroId: 'gabriel', funcoes: ['guitarra'] }] })
  })

  it('Formação que não existe devolve 404', async () => {
    const resposta = await pedir('/api/formacoes/nada', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ nome: 'Banda' }),
    })

    expect(resposta.status).toBe(404)
  })
})

describe('aplicar numa Escala', () => {
  it('põe os Membros da Formação na Equipe', async () => {
    await criarFormacao('banda', 'Banda', [
      ['gabriel', 'guitarra'],
      ['pedro', 'baixo'],
    ])

    const resposta = await pedir('/api/escalas/e1/formacao', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ formacaoId: 'banda' }),
    })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({
      equipe: [
        { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
        { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
      ],
    })
  })

  it('soma à Equipe existente sem apagar o Vocal nem a marca de Ministro', async () => {
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await porNaEquipe('e1', 'julia', ['vocal'])
    await criarFormacao('banda', 'Banda', [
      ['marcos', 'violao'],
      ['pedro', 'baixo'],
    ])

    const escala = await (
      await pedir('/api/escalas/e1/formacao', 'marcos', {
        method: 'POST',
        body: JSON.stringify({ formacaoId: 'banda' }),
      })
    ).json<{ equipe: { membroId: string; funcoes: string[]; ministro: boolean }[] }>()

    expect(escala.equipe).toEqual([
      { membroId: 'marcos', funcoes: ['vocal', 'violao'], ministro: true },
      { membroId: 'julia', funcoes: ['vocal'], ministro: false },
      { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
    ])
  })

  it('Formação que não existe devolve 404', async () => {
    const resposta = await pedir('/api/escalas/e1/formacao', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ formacaoId: 'nada' }),
    })

    expect(resposta.status).toBe(404)
  })

  it('Membro comum não aplica Formação', async () => {
    await criarFormacao('banda', 'Banda', [['pedro', 'baixo']])

    const resposta = await pedir('/api/escalas/e1/formacao', 'julia', {
      method: 'POST',
      body: JSON.stringify({ formacaoId: 'banda' }),
    })

    expect(resposta.status).toBe(403)
  })
})
