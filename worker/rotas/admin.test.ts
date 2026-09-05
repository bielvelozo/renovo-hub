import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { hojeEmBrasilia, somarDias } from '../../src/dominio'
import { CHAVE_LISTA_ESQUECI } from '../dados/acesso'
import {
  cookieDe,
  criarEscala,
  criarFormacao,
  criarFuncao,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'

const RAIZ = 'http://local.test'
const hoje = hojeEmBrasilia()
const PASSADO = somarDias(hoje, -14)
const FUTURO = somarDias(hoje, 14)

type MembroJson = {
  id: string
  nome: string
  ministro: boolean
  admin: boolean
  inativo: boolean
  funcoes: string[]
  sessoes?: number
  convites?: number
  convitesUsados?: number
  push?: number
}

type FuncaoJson = { id: string; nome: string; naipe: string; ordem: number }

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarFuncao('guitarra', 'instrumentos', 3, 'Guitarra')
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
})

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

const corpoDe = <T,>(resposta: Response) => resposta.json<T>()

describe('listas abertas ao Membro', () => {
  it('GET /api/membros traz os ativos com as Funções e esconde os inativos', async () => {
    await criarMembro({ id: 'saiu', nome: 'Saiu', inativo: true })

    const { membros } = await corpoDe<{ membros: MembroJson[] }>(await pedir('/api/membros', 'julia'))

    expect(membros.map((m) => m.id)).toEqual(['gabriel', 'julia', 'marcos'])
    expect(membros[0].funcoes).toEqual(['guitarra'])
    expect(membros[0].sessoes).toBeUndefined()
  })

  it('GET /api/funcoes sai na ordem definida pelo Admin', async () => {
    const { funcoes } = await corpoDe<{ funcoes: FuncaoJson[] }>(await pedir('/api/funcoes', 'julia'))

    expect(funcoes.map((f) => f.id)).toEqual(['vocal', 'guitarra'])
    expect(funcoes[0]).toEqual({ id: 'vocal', nome: 'Vocal', naipe: 'vocal', ordem: 1 })
  })
})

describe('Membros do Admin', () => {
  it('lista todos, inclusive inativos, com sessões, convites e push', async () => {
    await criarMembro({ id: 'saiu', nome: 'Saiu', inativo: true })
    await cookieDe('julia')
    await env.DB.prepare('insert into convites (token, membro_id, criado_em, usado_em) values (?, ?, ?, ?)')
      .bind('t1', 'julia', hoje, hoje)
      .run()
    await env.DB.prepare(
      'insert into push_inscricoes (id, membro_id, endpoint, p256dh, auth, criado_em) values (?, ?, ?, ?, ?, ?)',
    )
      .bind('p1', 'julia', 'https://push.exemplo/1', 'k', 'a', hoje)
      .run()

    const { membros } = await corpoDe<{ membros: MembroJson[] }>(await pedir('/api/admin/membros', 'gabriel'))
    const julia = membros.find((m) => m.id === 'julia')

    expect(membros.map((m) => m.id)).toContain('saiu')
    expect(julia).toMatchObject({ sessoes: 1, convites: 1, convitesUsados: 1, push: 1 })
  })

  it('cria um Membro com Funções e papéis', async () => {
    const resposta = await pedir('/api/admin/membros', 'gabriel', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Pedro', funcoes: ['guitarra'], ministro: true }),
    })

    expect(resposta.status).toBe(201)
    const membro = await corpoDe<MembroJson>(resposta)

    expect(membro).toMatchObject({ nome: 'Pedro', ministro: true, admin: false, inativo: false })
    expect(membro.funcoes).toEqual(['guitarra'])
  })

  it('edita nome, Funções e papéis', async () => {
    const resposta = await pedir('/api/admin/membros/julia', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ nome: 'Júlia Silva', funcoes: ['vocal', 'guitarra'], ministro: true }),
    })

    const membro = await corpoDe<MembroJson>(resposta)
    expect(membro.nome).toBe('Júlia Silva')
    expect(membro.ministro).toBe(true)
    expect(membro.funcoes).toEqual(['vocal', 'guitarra'])
  })

  it('recusa nome vazio e Função desconhecida', async () => {
    const semNome = await pedir('/api/admin/membros', 'gabriel', {
      method: 'POST',
      body: JSON.stringify({ nome: '  ' }),
    })
    expect(semNome.status).toBe(422)

    const funcaoInvalida = await pedir('/api/admin/membros/julia', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ funcoes: ['trompete'] }),
    })
    expect(funcaoInvalida.status).toBe(422)
  })

  it('remover apaga sessões, convites e push, e apaga a linha de quem nunca serviu', async () => {
    const cookie = await cookieDe('julia')
    await env.DB.prepare('insert into convites (token, membro_id, criado_em) values (?, ?, ?)')
      .bind('t1', 'julia', hoje)
      .run()

    const resposta = await pedir('/api/admin/membros/julia', 'gabriel', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    expect(await corpoDe<{ apagado: boolean }>(resposta)).toMatchObject({ apagado: true })

    const restou = await env.DB.prepare('select count(*) as n from membros where id = ?').bind('julia').first<{ n: number }>()
    expect(restou?.n).toBe(0)

    const sessoes = await env.DB.prepare('select count(*) as n from sessoes where membro_id = ?')
      .bind('julia')
      .first<{ n: number }>()
    expect(sessoes?.n).toBe(0)
    const convites = await env.DB.prepare('select count(*) as n from convites where membro_id = ?')
      .bind('julia')
      .first<{ n: number }>()
    expect(convites?.n).toBe(0)

    expect((await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie } })).status).toBe(401)
  })

  it('remover quem já serviu guarda o histórico: marca inativo e tira só das Escalas Agendadas', async () => {
    await criarEscala({ id: 'passada', data: PASSADO })
    await porNaEquipe('passada', 'julia', ['vocal'])
    await criarEscala({ id: 'futura', data: FUTURO })
    await porNaEquipe('futura', 'julia', ['vocal'])
    await criarFormacao('f1', 'Banda', [['julia', 'vocal']])
    const cookie = await cookieDe('julia')

    const resposta = await pedir('/api/admin/membros/julia', 'gabriel', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    expect(await corpoDe<{ apagado: boolean }>(resposta)).toMatchObject({ apagado: false })

    const membro = await env.DB.prepare('select inativo from membros where id = ?').bind('julia').first<{ inativo: number }>()
    expect(membro?.inativo).toBe(1)

    const equipes = await env.DB.prepare('select escala_id from equipe_membros where membro_id = ?')
      .bind('julia')
      .all<{ escala_id: string }>()
    expect(equipes.results.map((e) => e.escala_id)).toEqual(['passada'])

    const naFormacao = await env.DB.prepare('select count(*) as n from formacao_entradas where membro_id = ?')
      .bind('julia')
      .first<{ n: number }>()
    expect(naFormacao?.n).toBe(0)

    expect((await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie } })).status).toBe(401)
  })

  it('o inativo some da lista do esqueci e das listas de escalar', async () => {
    await criarEscala({ id: 'passada', data: PASSADO })
    await porNaEquipe('passada', 'julia', ['vocal'])
    await pedir('/api/admin/membros/julia', 'gabriel', { method: 'DELETE' })

    const { membros } = await corpoDe<{ membros: { id: string }[] }>(await SELF.fetch(`${RAIZ}/api/esqueci`))
    expect(membros.map((m) => m.id)).not.toContain('julia')

    const abertos = await corpoDe<{ membros: MembroJson[] }>(await pedir('/api/membros', 'gabriel'))
    expect(abertos.membros.map((m) => m.id)).not.toContain('julia')
  })

  it('devolve o acesso de um inativo pelo PATCH', async () => {
    await criarMembro({ id: 'saiu', nome: 'Saiu', inativo: true })

    const resposta = await pedir('/api/admin/membros/saiu', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ inativo: false }),
    })

    expect((await corpoDe<MembroJson>(resposta)).inativo).toBe(false)
  })

  it('o Admin não se remove nem tira o próprio papel', async () => {
    expect((await pedir('/api/admin/membros/gabriel', 'gabriel', { method: 'DELETE' })).status).toBe(422)

    const semPapel = await pedir('/api/admin/membros/gabriel', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ admin: false }),
    })
    expect(semPapel.status).toBe(422)
  })

  it('Ministro e Membro comum não entram na gestão de Membros', async () => {
    expect((await pedir('/api/admin/membros', 'marcos')).status).toBe(403)
    expect((await pedir('/api/admin/membros', 'julia')).status).toBe(403)
    expect((await pedir('/api/admin/membros/julia', 'marcos', { method: 'DELETE' })).status).toBe(403)
    expect((await SELF.fetch(`${RAIZ}/api/admin/membros`)).status).toBe(401)
  })
})

describe('Funções do Admin', () => {
  it('cria com naipe e ordem', async () => {
    const resposta = await pedir('/api/admin/funcoes', 'gabriel', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Baixo', naipe: 'instrumentos', ordem: 4 }),
    })

    expect(resposta.status).toBe(201)
    expect(await corpoDe<FuncaoJson>(resposta)).toMatchObject({ nome: 'Baixo', naipe: 'instrumentos', ordem: 4 })
  })

  it('recusa naipe fora dos três', async () => {
    const resposta = await pedir('/api/admin/funcoes', 'gabriel', {
      method: 'POST',
      body: JSON.stringify({ nome: 'Dança', naipe: 'palco' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('edita nome, naipe e ordem', async () => {
    const resposta = await pedir('/api/admin/funcoes/guitarra', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ nome: 'Guitarra elétrica', ordem: 9 }),
    })

    expect(await corpoDe<FuncaoJson>(resposta)).toMatchObject({ nome: 'Guitarra elétrica', ordem: 9 })
  })

  it('apaga a que ninguém usou', async () => {
    const resposta = await pedir('/api/admin/funcoes/guitarra', 'gabriel', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    const { funcoes } = await corpoDe<{ funcoes: FuncaoJson[] }>(await pedir('/api/funcoes', 'gabriel'))
    expect(funcoes.map((f) => f.id)).toEqual(['vocal'])
  })

  it('recusa apagar Função que está em alguma Equipe, pra não reescrever o passado', async () => {
    await criarEscala({ id: 'passada', data: PASSADO })
    await porNaEquipe('passada', 'julia', ['vocal'])

    const resposta = await pedir('/api/admin/funcoes/vocal', 'gabriel', { method: 'DELETE' })

    expect(resposta.status).toBe(409)
    const { funcoes } = await corpoDe<{ funcoes: FuncaoJson[] }>(await pedir('/api/funcoes', 'gabriel'))
    expect(funcoes.map((f) => f.id)).toContain('vocal')
  })
})

describe('configuração da lista "esqueci"', () => {
  it('desliga e religa a lista', async () => {
    const desligar = await pedir('/api/admin/configuracoes', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ listaEsqueci: false }),
    })

    expect(await corpoDe<{ listaEsqueci: boolean }>(desligar)).toEqual({ listaEsqueci: false })
    expect((await SELF.fetch(`${RAIZ}/api/esqueci`)).status).toBe(403)

    const guardado = await env.DB.prepare('select valor from configuracoes where chave = ?')
      .bind(CHAVE_LISTA_ESQUECI)
      .first<{ valor: string }>()
    expect(guardado?.valor).toBe('0')

    await pedir('/api/admin/configuracoes', 'gabriel', {
      method: 'PATCH',
      body: JSON.stringify({ listaEsqueci: true }),
    })

    expect((await SELF.fetch(`${RAIZ}/api/esqueci`)).status).toBe(200)
  })

  it('lê o estado atual, ligada por padrão', async () => {
    const resposta = await pedir('/api/admin/configuracoes', 'gabriel')

    expect(await corpoDe<{ listaEsqueci: boolean }>(resposta)).toEqual({ listaEsqueci: true })
  })
})

describe('apagar Formação', () => {
  it('some da lista', async () => {
    await criarFormacao('f1', 'Banda', [['julia', 'vocal']])

    const resposta = await pedir('/api/formacoes/f1', 'marcos', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    const { formacoes } = await corpoDe<{ formacoes: unknown[] }>(await pedir('/api/formacoes', 'julia'))
    expect(formacoes).toHaveLength(0)
  })

  it('Formação desconhecida devolve 404 e Membro comum 403', async () => {
    expect((await pedir('/api/formacoes/nada', 'marcos', { method: 'DELETE' })).status).toBe(404)
    expect((await pedir('/api/formacoes/f1', 'julia', { method: 'DELETE' })).status).toBe(403)
  })
})

describe('músicas a revisar', () => {
  it('o Admin vê a lista pelo filtro já existente', async () => {
    await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
    await env.DB.prepare('update musicas set revisar = 1 where id = ?').bind('rio').run()

    const { musicas } = await corpoDe<{ musicas: { id: string }[] }>(
      await pedir('/api/musicas?filtro=revisar', 'gabriel'),
    )

    expect(musicas.map((m) => m.id)).toEqual(['rio'])
  })
})
