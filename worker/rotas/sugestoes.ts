import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  avisoDeSugestaoAceita,
  avisoDeSugestaoGuardada,
  avisoDeSugestaoRecusada,
  descricaoDaMudanca,
  escalaPorId,
  estadoEscala,
  limparTitulo,
  transicao,
  videoIdDoLink,
} from '../../src/dominio'
import type { AcaoNaSugestao, Ministerio } from '../../src/dominio'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import { lerContextoDoCatalogo } from '../dados/catalogo'
import { criarItem } from '../dados/itens'
import { carregarMinisterio } from '../dados/ministerio'
import { avisarAutorDaSugestao, avisarMudancaDeMusica } from '../push/gatilhos'
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
  mudarEstado,
} from '../dados/sugestoes'
import type { Sugestao } from '../dados/sugestoes'
import { apresentarEscala } from '../http/escala'
import { apresentarSugestao, tituloDaSugestao } from '../http/sugestao'
import { corpoJson, ehMinutagem, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'
import { lerMinistradoPor, lerNovoItem } from './itens'

type FormaDaPromocao = { tipo: 'inteira' | 'trecho'; tom: string; inicio?: string; fim?: string; observacao?: string }

type Proposta = { musicaId: string | null; link: string | null; titulo: string | null }

export const TAMANHO_DO_MOTIVO = 80

export const sugestoes = new Hono<Contexto>()

sugestoes.get('/api/sugestoes', exigirMembro, async (c) => {
  const [todas, m, contexto] = await Promise.all([
    lerSugestoes(c.env.DB),
    carregarMinisterio(c.env.DB),
    lerContextoDoCatalogo(c.env.DB),
  ])

  return c.json({ sugestoes: todas.map((sugestao) => apresentarSugestao(m, sugestao, c.get('membro').id, contexto)) })
})

sugestoes.get('/api/sugestoes/:id', exigirMembro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)

  return c.json(await responder(c, sugestao.id))
})

sugestoes.post('/api/sugestoes', exigirMembro, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const m = await carregarMinisterio(c.env.DB, { ids: [] })

  const observacao = typeof corpo.observacao === 'string' ? corpo.observacao.trim() : ''
  const proposta = await lerProposta(c.env.DB, m, corpo)
  if (typeof proposta === 'string') return c.json({ erro: proposta }, 422)

  const repetida = (await lerSugestoes(c.env.DB)).find((outra) => ehAMesma(m, outra, proposta))
  if (repetida) {
    const quem = m.membros.find((x) => x.id === repetida.membroId)?.nome ?? 'Alguém'
    return c.json({ erro: `${quem} já sugeriu esta música.`, sugestaoId: repetida.id }, 409)
  }

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

  const membro = c.get('membro')
  if (!membro.admin && membro.id !== sugestao.membroId) {
    return c.json({ erro: 'Só quem sugeriu ou um Admin pode apagar uma Sugestão.' }, 403)
  }
  if (!membro.admin && sugestao.estado !== 'aberta') {
    return c.json({ erro: 'Essa Sugestão já foi decidida e não dá mais pra apagar.' }, 409)
  }

  await apagarSugestao(c.env.DB, sugestao.id)

  return c.json({ apagada: true })
})

sugestoes.post('/api/sugestoes/:id/guardar', exigirMinistro, (c) => decidir(c, c.req.param('id'), 'guardar'))

sugestoes.post('/api/sugestoes/:id/reabrir', exigirMinistro, (c) => decidir(c, c.req.param('id'), 'reabrir'))

sugestoes.post('/api/sugestoes/:id/recusar', exigirMinistro, (c) => decidir(c, c.req.param('id'), 'recusar'))

sugestoes.post('/api/sugestoes/:id/promover', exigirMinistro, async (c) => {
  const sugestao = await lerSugestao(c.env.DB, c.req.param('id'))
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)
  if (!transicao(sugestao.estado, 'promover')) return c.json({ erro: transicaoProibida(sugestao, 'promover') }, 409)

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

  const marca = lerMinistradoPor(depois.escalas[0], corpo.ministradoPor)
  if ('erro' in marca) return c.json({ erro: marca.erro }, 422)

  const eu = c.get('membro')
  const itemId = await criarItem(c.env.DB, escalaId, novo, {
    ministradoPor: marca.quem,
    origemSugestaoId: sugestao.id,
  })
  await marcarPromovida(c.env.DB, sugestao.id, musicaId, escalaId, { decididaPor: eu.id })

  const final = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const criado = final.escalas[0].itens.find((x) => x.id === itemId)
  const agora = new Date()

  if (criado) {
    await avisarMudancaDeMusica(
      c.env.DB,
      final,
      final.escalas[0],
      { acao: 'entrou', descricao: descricaoDaMudanca(final, criado) },
      eu.id,
      agora,
    )
  }

  await avisarAutorDaSugestao(
    c.env.DB,
    sugestao,
    'sugestao-aceita',
    avisoDeSugestaoAceita(final.escalas[0], tituloDaSugestao(final, { ...sugestao, musicaId })),
    escalaId,
    eu.id,
    agora,
  )

  const [completo, contexto] = await Promise.all([carregarMinisterio(c.env.DB), lerContextoDoCatalogo(c.env.DB)])

  return c.json(
    {
      escala: apresentarEscala(completo, escalaPorId(completo, escalaId), contexto.semanas),
      sugestao: apresentarSugestao(completo, (await lerSugestao(c.env.DB, sugestao.id))!, eu.id, contexto),
    },
    201,
  )
})

async function decidir(c: Context<Contexto>, id: string, acao: Exclude<AcaoNaSugestao, 'promover'>) {
  const sugestao = await lerSugestao(c.env.DB, id)
  if (!sugestao) return c.json({ erro: NAO_ENCONTRADA }, 404)

  const estado = transicao(sugestao.estado, acao)
  if (estado === null || estado === 'aceita') return c.json({ erro: transicaoProibida(sugestao, acao) }, 409)

  const motivo = acao === 'recusar' ? await lerMotivo(c) : ''
  if (motivo === null) return c.json({ erro: `O motivo tem no máximo ${TAMANHO_DO_MOTIVO} letras.` }, 422)

  const eu = c.get('membro')
  await mudarEstado(c.env.DB, sugestao.id, estado, { decididaPor: eu.id, motivo })

  const m = await carregarMinisterio(c.env.DB, { ids: [] })
  const titulo = tituloDaSugestao(m, sugestao)

  if (acao === 'guardar') {
    await avisarAutorDaSugestao(c.env.DB, sugestao, 'sugestao-guardada', avisoDeSugestaoGuardada(titulo), null, eu.id, new Date())
  }
  if (acao === 'recusar') {
    await avisarAutorDaSugestao(c.env.DB, sugestao, 'sugestao-recusada', avisoDeSugestaoRecusada(titulo, motivo), null, eu.id, new Date())
  }

  return c.json(await responder(c, sugestao.id))
}

async function lerMotivo(c: Context<Contexto>): Promise<string | null> {
  const { motivo } = await corpoJson<{ motivo?: unknown }>(c.req.raw)
  if (motivo === undefined || motivo === null) return ''
  if (typeof motivo !== 'string') return null

  const aparado = motivo.trim()
  return aparado.length > TAMANHO_DO_MOTIVO ? null : aparado
}

function transicaoProibida(sugestao: Sugestao, acao: AcaoNaSugestao): string {
  if (sugestao.estado === 'aceita') return 'Essa Sugestão já virou Item de uma Escala.'
  if (sugestao.estado === 'recusada') return 'Essa Sugestão já foi recusada.'
  if (acao === 'guardar') return 'Essa Sugestão já está guardada.'
  if (acao === 'reabrir') return 'Essa Sugestão já está aberta.'
  return 'Essa Sugestão não pode mudar assim.'
}

async function lerProposta(db: D1Database, m: Ministerio, corpo: Record<string, unknown>): Promise<Proposta | string> {
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

function ehAMesma(m: Ministerio, sugestao: Sugestao, proposta: Proposta): boolean {
  if (sugestao.estado !== 'aberta') return false
  if (proposta.musicaId && sugestao.musicaId === proposta.musicaId) return true

  const videoDaProposta = videoIdDe(m, proposta)
  return !!videoDaProposta && videoIdDe(m, sugestao) === videoDaProposta
}

function videoIdDe(m: Ministerio, alvo: { musicaId: string | null; link: string | null }): string | null {
  if (alvo.musicaId) return m.musicas.find((x) => x.id === alvo.musicaId)?.videoId ?? null
  return videoIdDoLink(alvo.link)
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
    ...limparTitulo(titulo, dados?.canal ?? ''),
    videoId,
    tomConhecido: null,
    tomOriginal: null,
    revisar: true,
  })
}

async function responder(c: Context<Contexto>, id: string) {
  const [m, contexto, sugestao] = await Promise.all([
    carregarMinisterio(c.env.DB),
    lerContextoDoCatalogo(c.env.DB),
    lerSugestao(c.env.DB, id),
  ])

  return apresentarSugestao(m, sugestao!, c.get('membro').id, contexto)
}

const NAO_ENCONTRADA = 'Sugestão não encontrada.'
