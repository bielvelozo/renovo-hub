import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'

const RAIZ = 'http://local.test'
const FUTURO = '2099-08-16'

type Resposta = {
  itens: {
    id: string
    tipo: string
    tom?: string
    inicio?: string
    fim?: string
    observacao: string
    ministradoPor: string | null
    descricao: string
    link?: string
    musica?: { id: string; titulo: string; capa: string }
    trechos?: { musicaId: string; tom: string; inicio: string; fim: string; link: string }[]
  }[]
}

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarFuncao('guitarra', 'instrumentos', 3)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'isa', nome: 'Isa', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarEscala({ id: 'e1', data: FUTURO })
  await porNaEquipe('e1', 'marcos', ['vocal'], true)
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
  await criarMusica('dono', 'Dono da Minha Afeição', '2anDhu7L-Cc')
})

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

async function adicionar(corpo: unknown, quem = 'marcos', escalaId = 'e1'): Promise<Response> {
  return pedir(`/api/escalas/${escalaId}/itens`, quem, { method: 'POST', body: JSON.stringify(corpo) })
}

describe('adicionar Item', () => {
  it('adiciona uma Música inteira e devolve a Escala com o Item', async () => {
    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })

    expect(resposta.status).toBe(201)
    const { itens } = await resposta.json<Resposta>()

    expect(itens).toHaveLength(1)
    expect(itens[0]).toMatchObject({ tipo: 'inteira', tom: 'D', observacao: '', descricao: 'Rio · Tom D' })
    expect(itens[0].musica).toMatchObject({ id: 'rio', titulo: 'Rio' })
    expect(itens[0].musica?.capa).toBe('https://i.ytimg.com/vi/s1oU-6vYc4E/maxresdefault.jpg')
    expect(itens[0].link).toBe('https://youtu.be/s1oU-6vYc4E')
  })

  it('adiciona um Trecho com minutagem e link que abre no início', async () => {
    const resposta = await adicionar({
      tipo: 'trecho',
      musicaId: 'rio',
      tom: 'D',
      inicio: '1:05',
      fim: '2:30',
      observacao: 'começar mais baixo',
    })

    const { itens } = await resposta.json<Resposta>()

    expect(itens[0]).toMatchObject({
      tipo: 'trecho',
      tom: 'D',
      inicio: '1:05',
      fim: '2:30',
      observacao: 'começar mais baixo',
      descricao: 'Rio (1:05–2:30) · Tom D',
      link: 'https://youtu.be/s1oU-6vYc4E?t=65',
    })
  })

  it('adiciona um Medley com dois Trechos, cada um com o seu Tom', async () => {
    const resposta = await adicionar({
      tipo: 'medley',
      trechos: [
        { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' },
        { musicaId: 'dono', tom: 'F', inicio: '2:10', fim: '3:40' },
      ],
    })

    expect(resposta.status).toBe(201)
    const { itens } = await resposta.json<Resposta>()

    expect(itens[0].tipo).toBe('medley')
    expect(itens[0].trechos?.map((t) => t.tom)).toEqual(['D', 'F'])
    expect(itens[0].trechos?.[1].link).toBe('https://youtu.be/2anDhu7L-Cc?t=130')
    expect(itens[0].descricao).toBe('Medley: Rio (0:00–1:20, Tom D) + Dono da Minha Afeição (2:10–3:40, Tom F)')
    expect(itens[0].tom).toBeUndefined()
  })

  it('preenche ministrado_por sozinho quando a Escala tem um só Ministro', async () => {
    const { itens } = await (await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })).json<Resposta>()

    expect(itens[0].ministradoPor).toBe('marcos')
  })

  it('deixa ministrado_por vazio quando há dois Ministros dividindo a escolha', async () => {
    await porNaEquipe('e1', 'isa', ['vocal'], true)

    const { itens } = await (await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })).json<Resposta>()

    expect(itens[0].ministradoPor).toBeNull()
  })

  it('aceita ministradoPor explícito', async () => {
    await porNaEquipe('e1', 'isa', ['vocal'], true)

    const { itens } = await (
      await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D', ministradoPor: 'isa' })
    ).json<Resposta>()

    expect(itens[0].ministradoPor).toBe('isa')
  })

  it('põe cada Item novo no fim do Repertório', async () => {
    await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })
    const { itens } = await (await adicionar({ tipo: 'inteira', musicaId: 'dono', tom: 'F' })).json<Resposta>()

    expect(itens.map((i) => i.musica?.id)).toEqual(['rio', 'dono'])
  })
})

describe('recusas ao adicionar', () => {
  it('recusa Item sem Tom', async () => {
    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: '' })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('Escolha o Tom.')
  })

  it('recusa minutagem fora do formato', async () => {
    const resposta = await adicionar({ tipo: 'trecho', musicaId: 'rio', tom: 'D', inicio: '1:5x', fim: '2:30' })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('Informe a minutagem no formato 1:05.')
  })

  it('recusa Trecho sem fim', async () => {
    const resposta = await adicionar({ tipo: 'trecho', musicaId: 'rio', tom: 'D', inicio: '1:05' })

    expect(resposta.status).toBe(422)
  })

  it('recusa Medley com um Trecho só', async () => {
    const resposta = await adicionar({
      tipo: 'medley',
      trechos: [{ musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' }],
    })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('Um Medley precisa de pelo menos dois Trechos.')
  })

  it('recusa Música desconhecida', async () => {
    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'nao-existe', tom: 'D' })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('Música desconhecida: nao-existe.')
  })

  it('recusa Música arquivada', async () => {
    await env.DB.prepare('update musicas set arquivada = 1 where id = ?').bind('rio').run()

    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('Rio está arquivada e não entra em Repertório.')
  })

  it('recusa tipo desconhecido', async () => {
    const resposta = await adicionar({ tipo: 'ensaio', musicaId: 'rio', tom: 'D' })

    expect(resposta.status).toBe(422)
  })

  it('recusa marca de ministrado_por em quem não é Ministro da Escala', async () => {
    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D', ministradoPor: 'julia' })

    expect(resposta.status).toBe(422)
  })

  it('devolve 404 numa Escala que não existe', async () => {
    const resposta = await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' }, 'marcos', 'e9')

    expect(resposta.status).toBe(404)
  })

  it('recusa Membro comum e quem não entrou', async () => {
    expect((await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' }, 'julia')).status).toBe(403)

    const semCookie = await SELF.fetch(`${RAIZ}/api/escalas/e1/itens`, { method: 'POST', body: '{}' })
    expect(semCookie.status).toBe(401)
  })
})

describe('editar Item', () => {
  it('muda o Tom e a observação', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D')

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tom: 'E', observacao: 'solo na transição' }),
    })

    expect(resposta.status).toBe(200)
    const { itens } = await resposta.json<Resposta>()

    expect(itens[0]).toMatchObject({ tom: 'E', observacao: 'solo na transição' })
  })

  it('reordena o Repertório pela posição pedida', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)
    await criarItemInteira('i2', 'e1', 'dono', 'F', 1)

    const resposta = await pedir('/api/escalas/e1/itens/i2', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ ordem: 0 }),
    })

    const { itens } = await resposta.json<Resposta>()

    expect(itens.map((i) => i.id)).toEqual(['i2', 'i1'])
  })

  it('troca os Trechos de um Medley', async () => {
    const { itens } = await (
      await adicionar({
        tipo: 'medley',
        trechos: [
          { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' },
          { musicaId: 'dono', tom: 'F', inicio: '2:10', fim: '3:40' },
        ],
      })
    ).json<Resposta>()

    const resposta = await pedir(`/api/escalas/e1/itens/${itens[0].id}`, 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({
        trechos: [
          { musicaId: 'dono', tom: 'G', inicio: '0:10', fim: '1:00' },
          { musicaId: 'rio', tom: 'A', inicio: '1:00', fim: '2:00' },
        ],
      }),
    })

    const depois = await resposta.json<Resposta>()

    expect(depois.itens[0].trechos?.map((t) => [t.musicaId, t.tom])).toEqual([
      ['dono', 'G'],
      ['rio', 'A'],
    ])
  })

  it('recusa Tom num Medley, que não tem Tom próprio', async () => {
    const { itens } = await (
      await adicionar({
        tipo: 'medley',
        trechos: [
          { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' },
          { musicaId: 'dono', tom: 'F', inicio: '2:10', fim: '3:40' },
        ],
      })
    ).json<Resposta>()

    const resposta = await pedir(`/api/escalas/e1/itens/${itens[0].id}`, 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tom: 'E' }),
    })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe(
      'O Medley não tem Tom próprio: cada Trecho tem o seu.',
    )
  })

  it('recusa Tom vazio', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D')

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tom: '' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('devolve 404 num Item que não é dessa Escala', async () => {
    await criarEscala({ id: 'e2', data: FUTURO })
    await criarItemInteira('i1', 'e2', 'rio', 'D')

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tom: 'E' }),
    })

    expect(resposta.status).toBe(404)
  })
})

describe('remover Item', () => {
  it('tira o Item do Repertório e renumera o resto', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)
    await criarItemInteira('i2', 'e1', 'dono', 'F', 1)

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    const { itens } = await resposta.json<Resposta>()

    expect(itens.map((i) => i.id)).toEqual(['i2'])
  })

  it('apaga junto os Trechos do Medley', async () => {
    const { itens } = await (
      await adicionar({
        tipo: 'medley',
        trechos: [
          { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' },
          { musicaId: 'dono', tom: 'F', inicio: '2:10', fim: '3:40' },
        ],
      })
    ).json<Resposta>()

    await pedir(`/api/escalas/e1/itens/${itens[0].id}`, 'marcos', { method: 'DELETE' })

    const { results } = await env.DB.prepare('select id from trechos').all()

    expect(results).toHaveLength(0)
  })
})
