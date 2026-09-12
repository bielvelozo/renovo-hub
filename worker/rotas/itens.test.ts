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
    ministradoPorNome: string | null
    atualizadoEm: string | null
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

  it('muda Tom e minutagem dos Trechos de um Medley', async () => {
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
          { musicaId: 'rio', tom: 'G', inicio: '0:10', fim: '1:00' },
          { musicaId: 'dono', tom: 'A', inicio: '1:00', fim: '2:00' },
        ],
      }),
    })

    const depois = await resposta.json<Resposta>()

    expect(depois.itens[0].trechos?.map((t) => [t.musicaId, t.tom])).toEqual([
      ['rio', 'G'],
      ['dono', 'A'],
    ])
  })

  it('recusa trocar as músicas de um Medley pelo PATCH', async () => {
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

    expect(resposta.status).toBe(422)
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

async function atualizadoEmDe(itemId: string): Promise<string | null> {
  const linha = await env.DB.prepare('select atualizado_em from itens where id = ?')
    .bind(itemId)
    .first<{ atualizado_em: string | null }>()

  return linha?.atualizado_em ?? null
}

async function tiposDaFila(): Promise<string[]> {
  const { results } = await env.DB.prepare('select tipo from notificacoes').all<{ tipo: string }>()

  return results.map((linha) => linha.tipo)
}

describe('marca de atualização do Item', () => {
  it('grava a marca quando o Item nasce', async () => {
    const { itens } = await (await adicionar({ tipo: 'inteira', musicaId: 'rio', tom: 'D' })).json<Resposta>()

    expect(itens[0].atualizadoEm).not.toBeNull()
  })

  it('grava a marca em cada campo editável', async () => {
    const campos: Record<string, unknown>[] = [
      { tom: 'E' },
      { observacao: 'começar baixo' },
      { tipo: 'trecho', inicio: '1:00', fim: '2:00' },
      { ministradoPor: 'marcos' },
    ]

    for (const corpo of campos) {
      await criarItemInteira('alvo', 'e1', 'rio', 'D', 0)
      await env.DB.prepare('update itens set atualizado_em = null where id = ?').bind('alvo').run()

      await pedir('/api/escalas/e1/itens/alvo', 'marcos', { method: 'PATCH', body: JSON.stringify(corpo) })

      expect(await atualizadoEmDe('alvo')).not.toBeNull()
      await env.DB.prepare('delete from itens where id = ?').bind('alvo').run()
    }
  })

  it('grava a marca ao mexer nos Trechos do Medley', async () => {
    const { itens } = await (
      await adicionar({
        tipo: 'medley',
        trechos: [
          { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:20' },
          { musicaId: 'dono', tom: 'F', inicio: '2:10', fim: '3:40' },
        ],
      })
    ).json<Resposta>()

    await env.DB.prepare('update itens set atualizado_em = null where id = ?').bind(itens[0].id).run()

    await pedir(`/api/escalas/e1/itens/${itens[0].id}`, 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({
        trechos: [
          { musicaId: 'rio', tom: 'G', inicio: '0:00', fim: '1:20' },
          { musicaId: 'dono', tom: 'A', inicio: '2:10', fim: '3:40' },
        ],
      }),
    })

    expect(await atualizadoEmDe(itens[0].id)).not.toBeNull()
  })

  it('não grava a marca no reordenar', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)
    await criarItemInteira('i2', 'e1', 'dono', 'F', 1)
    await env.DB.prepare('update itens set atualizado_em = null').run()

    await pedir('/api/escalas/e1/itens/i2', 'marcos', { method: 'PATCH', body: JSON.stringify({ ordem: 0 }) })

    expect(await atualizadoEmDe('i2')).toBeNull()
    expect(await tiposDaFila()).toEqual([])
  })
})

describe('trocar o tipo e quem puxa o Item', () => {
  it('vira Trecho com minutagem e volta a ser Música inteira', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)

    const virou = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tipo: 'trecho', inicio: '1:00', fim: '2:00' }),
    })
    expect((await virou.json<Resposta>()).itens[0]).toMatchObject({ tipo: 'trecho', inicio: '1:00', fim: '2:00' })

    const voltou = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tipo: 'inteira' }),
    })
    const item = (await voltou.json<Resposta>()).itens[0]
    expect(item.tipo).toBe('inteira')
    expect(item.inicio).toBeUndefined()
  })

  it('recusa virar Trecho sem minutagem', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tipo: 'trecho' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('recusa trocar o tipo de um Medley', async () => {
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
      body: JSON.stringify({ tipo: 'inteira' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('grava quem puxa quando é Ministro da Escala', async () => {
    await porNaEquipe('e1', 'isa', ['vocal'], true)
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ ministradoPor: 'isa' }),
    })

    expect((await resposta.json<Resposta>()).itens[0]).toMatchObject({
      ministradoPor: 'isa',
      ministradoPorNome: 'Isa',
    })
  })

  it('recusa quem não é Ministro da Escala', async () => {
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)

    const resposta = await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ ministradoPor: 'julia' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('avisa a Equipe quando o tipo ou quem puxa muda', async () => {
    await porNaEquipe('e1', 'isa', ['vocal'], true)
    await porNaEquipe('e1', 'julia', ['vocal'])
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)

    await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tipo: 'trecho', inicio: '1:00', fim: '2:00' }),
    })
    expect(await tiposDaFila()).toEqual(['musica', 'musica'])

    await pedir('/api/escalas/e1/itens/i1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ ministradoPor: 'isa' }),
    })
    const { results } = await env.DB.prepare('select mudancas from notificacoes where membro_id = ?')
      .bind('julia')
      .all<{ mudancas: number }>()
    expect(results[0].mudancas).toBe(2)
  })
})
