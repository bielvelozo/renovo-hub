import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  cobertura,
  combinaBusca,
  historicoDaMusica,
  limparTitulo,
  musicaPorId,
  normalizarTexto,
  videoIdDoLink,
} from '../../src/dominio'
import type { Musica } from '../../src/dominio'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import { lerAnexosDoDono, letraMaisNova } from '../dados/anexos'
import { lerContextoDoCatalogo } from '../dados/catalogo'
import { acharNoCifraClub } from '../dados/cifraclub'
import { carregarMinisterio } from '../dados/ministerio'
import {
  apagarMusica,
  atualizarMusica,
  criarMusica,
  definirArquivada,
  estaEmAlgumRepertorio,
  musicaPorVideo,
} from '../dados/musicas'
import { dadosDoVideo } from '../dados/oembed'
import { buscarNoYoutube } from '../dados/youtube'
import { apresentarMusica, naListaDeMusicas } from '../http/musica'
import { corpoJson, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'

export const musicas = new Hono<Contexto>()

musicas.post('/api/musicas/resolver', exigirMembro, async (c) => {
  const { link } = await corpoJson<{ link?: unknown }>(c.req.raw)
  const videoId = videoIdDoLink(typeof link === 'string' ? link : null)
  if (!videoId) return c.json({ erro: LINK_INVALIDO }, 422)

  const dados = await dadosDoVideo(videoId)
  if (!dados) return c.json({ erro: VIDEO_DESCONHECIDO }, 404)

  const existente = await musicaPorVideo(c.env.DB, videoId)

  return c.json({ ...dados, musica: existente ? await responderMusica(c.env.DB, existente) : null })
})

musicas.get('/api/musicas/buscar', exigirMembro, async (c) => {
  const termo = (c.req.query('termo') ?? '').trim()
  if (!termo) return c.json({ erro: 'Escreva o nome da música.' }, 422)

  const chave = c.env.YOUTUBE_API_KEY
  if (!chave) return c.json({ erro: BUSCA_SEM_CHAVE }, 503)

  const achados = await buscarNoYoutube(chave, termo)
  if (!achados) return c.json({ erro: BUSCA_FALHOU }, 502)

  return c.json({ achados })
})

musicas.post('/api/musicas', exigirMinistro, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const videoId = videoIdDoLink(typeof corpo.link === 'string' ? corpo.link : null)
  if (!videoId) return c.json({ erro: LINK_INVALIDO }, 422)

  const existente = await musicaPorVideo(c.env.DB, videoId)
  if (existente) {
    return c.json({ erro: 'Esse vídeo já está no catálogo.', musica: await responderMusica(c.env.DB, existente) }, 409)
  }

  const dados = await dadosDoVideo(videoId)
  const titulo = (typeof corpo.titulo === 'string' ? corpo.titulo.trim() : '') || (dados?.titulo ?? '')
  if (!titulo) return c.json({ erro: 'Não deu pra ler o título do vídeo. Escreva o título.' }, 422)

  const tons = lerTons(corpo)
  if (tons === null) return c.json({ erro: TOM_INVALIDO }, 422)

  const artista = (typeof corpo.artista === 'string' ? corpo.artista.trim() : '') || (dados?.canal ?? '')
  const id = await criarMusica(c.env.DB, {
    ...limparTitulo(titulo, artista),
    videoId,
    tomConhecido: tons.tomConhecido ?? null,
    tomOriginal: tons.tomOriginal ?? null,
    revisar: true,
  })

  return c.json(await responderMusica(c.env.DB, id), 201)
})

musicas.get('/api/musicas', exigirMembro, async (c) => {
  const escalaId = c.req.query('escalaId') || undefined
  const [m, contexto] = await Promise.all([carregarMinisterio(c.env.DB), lerContextoDoCatalogo(c.env.DB, escalaId)])
  if (escalaId && !m.escalas.some((escala) => escala.id === escalaId)) {
    return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)
  }

  const busca = c.req.query('busca') ?? ''
  const soRevisar = c.req.query('filtro') === 'revisar'
  const comArquivadas = c.req.query('arquivadas') === '1'

  const achadas = m.musicas
    .filter((musica) => comArquivadas || !musica.arquivada)
    .filter((musica) => combinaBusca(musica, busca))
    .filter((musica) => !soRevisar || musica.revisar)

  return c.json({
    musicas: porTitulo(achadas).map((musica) => naListaDeMusicas(m, musica, contexto)),
    semanasDeRepeticao: contexto.semanas,
  })
})

musicas.get('/api/cifraclub', exigirMinistro, async (c) => {
  const termo = (c.req.query('termo') ?? '').trim()
  if (!termo) return c.json({ erro: 'Escreva o nome da música.' }, 422)

  return c.json({ achado: await acharNoCifraClub(termo, c.req.query('artista') ?? '') })
})

musicas.get('/api/musicas/:id', exigirMembro, async (c) => {
  const escalaId = c.req.query('escalaId') || undefined
  const [m, contexto] = await Promise.all([carregarMinisterio(c.env.DB), lerContextoDoCatalogo(c.env.DB, escalaId)])
  const musica = m.musicas.find((x) => x.id === c.req.param('id'))
  if (!musica) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  if (escalaId && !m.escalas.some((escala) => escala.id === escalaId)) {
    return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)
  }

  return c.json({
    ...apresentarMusica(m, musica, contexto),
    cobertura: escalaId ? cobertura(m, escalaId, musica.id) : null,
    anexos: await lerAnexosDoDono(c.env.DB, { musicaId: musica.id }),
    letra: await letraMaisNova(c.env.DB, { musicaId: musica.id }),
  })
})

musicas.patch('/api/musicas/:id', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [] })
  if (!m.musicas.some((x) => x.id === id)) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)

  if (corpo.titulo !== undefined && !ehTextoCheio(corpo.titulo)) {
    return c.json({ erro: 'A música precisa de um título.' }, 422)
  }
  if (corpo.artista !== undefined && typeof corpo.artista !== 'string') {
    return c.json({ erro: 'O artista é um texto.' }, 422)
  }
  if (corpo.revisar !== undefined && typeof corpo.revisar !== 'boolean') {
    return c.json({ erro: 'A marca de revisar é sim ou não.' }, 422)
  }

  const tons = lerTons(corpo)
  if (tons === null) return c.json({ erro: TOM_INVALIDO }, 422)

  await atualizarMusica(c.env.DB, id, {
    titulo: typeof corpo.titulo === 'string' ? corpo.titulo.trim() : undefined,
    artista: typeof corpo.artista === 'string' ? corpo.artista.trim() : undefined,
    revisar: corpo.revisar as boolean | undefined,
    ...tons,
  })

  return c.json(await responderMusica(c.env.DB, id))
})

musicas.delete('/api/musicas/:id', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB)
  const musica = m.musicas.find((x) => x.id === id)
  if (!musica) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  if (historicoDaMusica(m, id).length) {
    return c.json({ erro: `${musica.titulo} já foi tocada: arquive em vez de apagar.` }, 409)
  }

  if (await estaEmAlgumRepertorio(c.env.DB, id)) {
    return c.json({ erro: `${musica.titulo} está no repertório de uma escala. Tire de lá antes de apagar.` }, 409)
  }

  await apagarMusica(c.env.DB, id)

  return c.json({ apagada: true })
})

musicas.post('/api/musicas/:id/arquivar', exigirMinistro, (c) => guardar(c, c.req.param('id'), true))

musicas.post('/api/musicas/:id/desarquivar', exigirMinistro, (c) => guardar(c, c.req.param('id'), false))

async function guardar(c: Context<Contexto>, id: string, arquivada: boolean) {
  const m = await carregarMinisterio(c.env.DB)
  const musica = m.musicas.find((x) => x.id === id)
  if (!musica) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  if (arquivada && !historicoDaMusica(m, id).length) {
    return c.json({ erro: `${musica.titulo} nunca foi tocada: apague em vez de arquivar.` }, 422)
  }

  await definirArquivada(c.env.DB, id, arquivada)

  return c.json(await responderMusica(c.env.DB, id))
}

function porTitulo(musicas: Musica[]): Musica[] {
  return [...musicas].sort((a, b) => normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo)))
}

function lerTons(corpo: Record<string, unknown>): { tomConhecido?: string | null; tomOriginal?: string | null } | null {
  const tons: { tomConhecido?: string | null; tomOriginal?: string | null } = {}

  for (const campo of ['tomConhecido', 'tomOriginal'] as const) {
    const valor = corpo[campo]
    if (valor === undefined) continue
    if (valor === null) tons[campo] = null
    else if (ehTextoCheio(valor)) tons[campo] = valor.trim()
    else return null
  }

  return tons
}

async function responderMusica(db: D1Database, id: string) {
  const [m, contexto] = await Promise.all([carregarMinisterio(db), lerContextoDoCatalogo(db)])
  return apresentarMusica(m, musicaPorId(m, id), contexto)
}

const LINK_INVALIDO = 'Cole o link do vídeo no YouTube.'
const VIDEO_DESCONHECIDO = 'O YouTube não reconheceu esse vídeo.'
const TOM_INVALIDO = 'O tom é um texto ou vazio.'
const MUSICA_NAO_ENCONTRADA = 'Música não encontrada.'
const ESCALA_NAO_ENCONTRADA = 'Escala não encontrada.'
const BUSCA_SEM_CHAVE = 'A busca no YouTube ainda não está configurada. Cole o link do vídeo.'
const BUSCA_FALHOU = 'O YouTube não respondeu a busca. Tente de novo ou cole o link.'
