import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  cookieDaResposta,
  cookieDe,
  criarFuncao,
  criarMembro,
  definirConfiguracao,
  limparBanco,
} from '../testes/apoio'

const RAIZ = 'http://local.test'

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('guitarra', 'instrumentos', 2)
  await criarFuncao('vocal', 'vocal', 1)
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
})

describe('convites', () => {
  it('o Admin gera um convite e o link leva a uma sessão', async () => {
    const criacao = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('gabriel') },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(criacao.status).toBe(201)
    const { link } = await criacao.json<{ link: string }>()
    expect(link).toMatch(/^\/entrar\/[-0-9a-f]{36}$/)

    const entrada = await SELF.fetch(`${RAIZ}${link}`, { redirect: 'manual' })

    expect(entrada.status).toBe(302)
    expect(entrada.headers.get('Location')).toBe('/instalar')
    const cookie = entrada.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain('sessao=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=31536000')
    expect(cookie).not.toContain('Secure')
  })

  it('o Ministro também gera convite', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('marcos') },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(resposta.status).toBe(201)
  })

  it('o Membro comum em rota de admin recebe 403', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('julia') },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(resposta.status).toBe(403)
    expect(await resposta.json()).toEqual({ erro: 'Só um ministro ou admin pode fazer isso.' })
  })

  it('sem cookie a rota de admin recebe 401', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(resposta.status).toBe(401)
  })

  it('convite para Membro que não existe recebe 404', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('gabriel') },
      body: JSON.stringify({ membroId: 'ninguem' }),
    })

    expect(resposta.status).toBe(404)
  })

  it('o mesmo convite abre em outro aparelho e cria outra sessão', async () => {
    const criacao = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('gabriel') },
      body: JSON.stringify({ membroId: 'julia' }),
    })
    const { link } = await criacao.json<{ link: string }>()

    const celular = await SELF.fetch(`${RAIZ}${link}`, { redirect: 'manual' })
    const computador = await SELF.fetch(`${RAIZ}${link}`, { redirect: 'manual' })

    expect(computador.status).toBe(302)
    expect(cookieDaResposta(celular)).not.toBe(cookieDaResposta(computador))

    const sessoes = await env.DB.prepare('select count(*) as n from sessoes where membro_id = ?')
      .bind('julia')
      .first<{ n: number }>()
    expect(sessoes?.n).toBe(2)
  })

  it('o convite guarda quando foi usado pela primeira vez', async () => {
    const criacao = await SELF.fetch(`${RAIZ}/api/admin/convites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: await cookieDe('gabriel') },
      body: JSON.stringify({ membroId: 'julia' }),
    })
    const { token } = await criacao.json<{ token: string }>()

    expect(await usadoEm(token)).toBeNull()
    await SELF.fetch(`${RAIZ}/entrar/${token}`, { redirect: 'manual' })
    const primeiroUso = await usadoEm(token)
    expect(primeiroUso).toBeTruthy()

    await SELF.fetch(`${RAIZ}/entrar/${token}`, { redirect: 'manual' })
    expect(await usadoEm(token)).toBe(primeiroUso)
  })

  it('token inválido não cria sessão', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/entrar/nao-existe`, { redirect: 'manual' })

    expect(resposta.status).toBe(302)
    expect(resposta.headers.get('Location')).toBe('/esqueci?convite=invalido')
    expect(resposta.headers.get('Set-Cookie')).toBeNull()
  })
})

describe('/api/eu', () => {
  it('devolve o Membro da sessão, com as Funções e a marca de silenciado', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie: await cookieDe('marcos') } })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toEqual({
      id: 'marcos',
      nome: 'Marcos',
      admin: false,
      ministro: true,
      inativo: false,
      foto: null,
      funcoes: ['vocal'],
      silenciado: false,
    })
  })

  it('sem cookie devolve 401', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/eu`)

    expect(resposta.status).toBe(401)
    expect(await resposta.json()).toEqual({ erro: 'Entre pelo seu link de convite.' })
  })

  it('com cookie de sessão encerrada devolve 401', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie: 'sessao=ja-era' } })

    expect(resposta.status).toBe(401)
  })

  it('marca o último uso da sessão', async () => {
    const cookie = await cookieDe('julia')
    await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie } })

    const sessao = await env.DB.prepare('select ultimo_uso from sessoes where token = ?')
      .bind(cookie.replace('sessao=', ''))
      .first<{ ultimo_uso: string }>()
    expect(sessao?.ultimo_uso).not.toBe('2026-09-05T12:00:00.000Z')
  })
})

describe('/api/esqueci', () => {
  it('sem configuração gravada a lista nasce ligada e não exige sessão', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/esqueci`)

    expect(resposta.status).toBe(200)
    const { membros } = await resposta.json<{ membros: { id: string; nome: string }[] }>()
    expect(membros).toEqual([
      { id: 'gabriel', nome: 'Gabriel' },
      { id: 'julia', nome: 'Júlia' },
      { id: 'marcos', nome: 'Marcos' },
    ])
  })

  it('escolher um Membro cria a sessão', async () => {
    const escolha = await SELF.fetch(`${RAIZ}/api/esqueci`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(escolha.status).toBe(200)
    const cookie = cookieDaResposta(escolha)
    expect(cookie).toContain('sessao=')

    const eu = await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie } })
    expect(await eu.json()).toMatchObject({ id: 'julia' })
  })

  it('com a lista desligada pelo Admin, não lista nem deixa escolher', async () => {
    await definirConfiguracao('lista_esqueci', '0')

    const lista = await SELF.fetch(`${RAIZ}/api/esqueci`)
    const escolha = await SELF.fetch(`${RAIZ}/api/esqueci`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ membroId: 'julia' }),
    })

    expect(lista.status).toBe(403)
    expect(escolha.status).toBe(403)
    expect(escolha.headers.get('Set-Cookie')).toBeNull()
  })

  it('escolher Membro que não existe devolve 404', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/esqueci`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ membroId: 'ninguem' }),
    })

    expect(resposta.status).toBe(404)
  })
})

describe('/api/sair', () => {
  it('encerra a sessão do aparelho e limpa o cookie', async () => {
    const cookie = await cookieDe('julia')

    const saida = await SELF.fetch(`${RAIZ}/api/sair`, { method: 'POST', headers: { cookie } })

    expect(saida.status).toBe(200)
    expect(saida.headers.get('Set-Cookie')).toContain('sessao=;')

    const eu = await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie } })
    expect(eu.status).toBe(401)
  })

  it('sem sessão devolve 401', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/sair`, { method: 'POST' })

    expect(resposta.status).toBe(401)
  })
})

async function usadoEm(token: string): Promise<string | null> {
  const linha = await env.DB.prepare('select usado_em from convites where token = ?')
    .bind(token)
    .first<{ usado_em: string | null }>()
  return linha?.usado_em ?? null
}
