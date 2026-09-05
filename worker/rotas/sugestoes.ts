import { Hono } from 'hono'
import type { Context } from 'hono'
import { estadoEscala, ministradoPorDe, videoIdDoLink } from '../../src/dominio'
import type { Membro, Ministerio } from '../../src/dominio'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import { criarItem } from '../dados/itens'
import { carregarMinisterio } from '../dados/ministerio'
import { criarMusica, musicaPorVideo } from '../dados/musicas'
import { dadosDoVideo } from '../dados/oembed'
import {
  apagarSugestao,
  apoiar,
  criarSugestao,
  desapoiar,
  lerSugestao,
  lerSugestoes,
  marcarPromovida,
} from '../dados/sugestoes'
import type { Sugestao } from '../dados/sugestoes'
import { apresentarEscala } from '../http/escala'
import { apresentarSugestao } from '../http/sugestao'
import { corpoJson, ehMinutagem, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'
import { lerNovoItem } from './itens'

type FormaDaPromocao = { tipo: 'inteira' | 'trecho'; tom: string; inicio?: string; fim?: string; observacao?: string }

export const sugestoes = new Hono<Contexto>()

sugestoes.get('/api/sugestoes', exigirMembro, async (c) => {
  const comPromovidas = c.req.query('promovidas') === '1'
  const todas = await lerSugestoes(c.env.DB)
  const lista = todas.filter((sugestao) => comPromovidas || !sugestao.promovidaEm)

  const m = await carregarMinisterio(c.env.DB, { ids: [] })

  return c.json({ sugestoes: lista.map((sugestao) => apresentarSugestao(m, sugestao, c.get('membro').id)) })
})

sugestoes.post('/api/sugestoes', exigirMembro, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const m = await carregarMinisterio(c.env.DB, { ids: [] })

  const observacao = typeof corpo.observacao === 'string' ? corpo.observacao.trim() : ''
  const proposta = await lerProposta(c.env.DB, m, corpo)
  if (typeof proposta === 'string') return c.json({ erro: proposta }, 422)

  const id = await criarSugestao(c.env.DB, { membroId: c.get('membro').id, ...proposta, observacao })

  return c.json(await responder(c, id), 201)
})

sugestoes.post('/api/sugestoes/:id/apoiar', exigirMembro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)

  await apoiar(c.env.DB, sugestao.id, c.get('membro').id)

  return c.json(await responder(c, sugestao.id))
})

sugestoes.delete('/api/sugestoes/:id/apoiar', exigirMembro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)

  await desapoiar(c.env.DB, sugestao.id, c.get('membro').id)

  return c.json(await responder(c, sugestao.id))
})

sugestoes.delete('/api/sugestoes/:id', exigirMembro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)

  if (!podeApagar(c.get('membro'), sugestao)) {
    return c.json({ erro: 'Só quem sugeriu ou um Admin pode apagar uma Sugestão.' }, 403)
  }

  await apagarSugestao(c.env.DB, sugestao.id)

  return c.json({ apagada: true })
})

sugestoes.post('/api/sugestoes/:id/promover', exigirMinistro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)
  if (sugestao.promovidaEm) return c.json({ erro: 'Essa Sugestão já virou Item de uma Escala.' }, 409)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const escalaId = typeof corpo.escalaId === 'string' ? corpo.escalaId : ''

  const antes = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const escala = antes.escalas[0]
  if (!escala) return c.json({ erro: 'Escala não encontrada.' }, 404)
  if (estadoEscala(escala, antes.hoje) !== 'agendada') {
    return c.json({ erro: 'Só dá pra promover para uma Escala Agendada.' }, 422)
  }

  const forma = lerForma(corpo)
  if (typeof forma === 'string') return c.json({ erro: forma }, 422)

  const musicaId = await garantirMusica(c.env.DB, sugestao)
  if (!musicaId) return c.json({ erro: 'O YouTube não reconheceu o vídeo dessa Sugestão.' }, 404)

  const depois = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const novo = lerNovoItem(depois, { ...forma, musicaId })
  if (typeof novo === 'string') return c.json({ erro: novo }, 422)

  await criarItem(c.env.DB, escalaId, novo, {
    ministradoPor: ministradoPorDe(depois.escalas[0], null),
    origemSugestaoId: sugestao.id,
  })
  await marcarPromovida(c.env.DB, sugestao.id, musicaId)

  const final = await carregarMinisterio(c.env.DB, { ids: [escalaId] })

  return c.json(
    {
      escala: apresentarEscala(final, final.escalas[0]),
      sugestao: apresentarSugestao(final, (await lerSugestao(c.env.DB, sugestao.id))!, c.get('membro').id),
    },
    201,
  )
})

async function lerProposta(
  db: D1Database,
  m: Ministerio,
  corpo: Record<string, unknown>,
): Promise<{ musicaId: string | null; link: string | null; titulo: string | null } | string> {
  if (typeof corpo.musicaId === 'string') {
    const musica = m.musicas.find((x) => x.id === corpo.musicaId)
    if (!musica) return `Música desconhecida: ${corpo.musicaId}.`
    if (musica.arquivada) return `${musica.titulo} está arquivada.`
    return { musicaId: musica.id, link: null, titulo: null }
  }

  if (corpo.link === undefined) return 'Escolha uma Música do catálogo ou cole o link do vídeo no YouTube.'

  const videoId = videoIdDoLink(typeof corpo.link === 'string' ? corpo.link : null)
  if (!videoId) return 'Cole o link do vídeo no YouTube.'
  if (!ehTextoCheio(corpo.titulo)) return 'Escreva o título da Música.'

  const jaNoCatalogo = await musicaPorVideo(db, videoId)
  if (jaNoCatalogo) return { musicaId: jaNoCatalogo, link: null, titulo: null }

  return { musicaId: null, link: corpo.link as string, titulo: corpo.titulo.trim() }
}

function lerForma(corpo: Record<string, unknown>): FormaDaPromocao | string {
  const tipo = corpo.tipo === undefined ? 'inteira' : corpo.tipo
  if (tipo !== 'inteira' && tipo !== 'trecho') return 'Uma Sugestão vira Música inteira ou Trecho.'
  if (!ehTextoCheio(corpo.tom)) return 'Escolha o Tom.'

  const observacao = typeof corpo.observacao === 'string' ? corpo.observacao : ''
  if (tipo === 'inteira') return { tipo, tom: corpo.tom.trim(), observacao }

  if (!ehMinutagem(corpo.inicio) || !ehMinutagem(corpo.fim)) return 'Informe a minutagem no formato 1:05.'

  return { tipo, tom: corpo.tom.trim(), inicio: corpo.inicio, fim: corpo.fim, observacao }
}

async function garantirMusica(db: D1Database, sugestao: Sugestao): Promise<string | null> {
  if (sugestao.musicaId) return sugestao.musicaId

  const videoId = videoIdDoLink(sugestao.link)
  if (!videoId) return null

  const existente = await musicaPorVideo(db, videoId)
  if (existente) return existente

  const dados = await dadosDoVideo(videoId)
  const titulo = sugestao.titulo?.trim() || dados?.titulo
  if (!titulo) return null

  return criarMusica(db, {
    titulo,
    artista: dados?.canal ?? '',
    videoId,
    tomConhecido: null,
    tomOriginal: null,
  })
}

function podeApagar(membro: Membro, sugestao: Sugestao): boolean {
  return membro.admin || membro.id === sugestao.membroId
}

async function responder(c: Context<Contexto>, id: string) {
  const m = await carregarMinisterio(c.env.DB, { ids: [] })
  const sugestao = await lerSugestao(c.env.DB, id)

  return apresentarSugestao(m, sugestao!, c.get('membro').id)
}

const NAO_ENCONTRADA = 'Sugestão não encontrada.'
