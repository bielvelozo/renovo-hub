import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  domingoDaSantaCeia,
  domingosDoMes,
  linkDeVideos,
  textoParaWhatsApp,
  unicoDoSom,
  videosDaPlaylist,
} from '../../src/dominio'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import {
  HORARIO_DA_SANTA_CEIA,
  HORARIO_DE_DOMINGO,
  ROTULO_DE_DOMINGO,
  atualizarEscala,
  criarEscala,
  datasJaCriadas,
  definirCancelada,
  definirEntradaDaEquipe,
  tirarDaEquipe,
} from '../dados/escalas'
import { carregarMinisterio } from '../dados/ministerio'
import { conferirVideos, reconferirVideos } from '../dados/videos'
import { resumirEscala } from '../http/escala'
import { responderEscala } from '../http/responder'
import { avisarCancelada, avisarEscalados, avisarRemarcada } from '../push/gatilhos'
import { corpoJson, ehData, ehHorario, ehListaDeTextos, ehMes, ehTextoCheio } from '../http/validacao'
import type { Escala } from '../../src/dominio'
import type { Contexto } from '../tipos'

export const escalas = new Hono<Contexto>()

escalas.get('/api/escalas', exigirMembro, async (c) => {
  const mes = c.req.query('mes')
  if (mes !== undefined && !ehMes(mes)) return c.json({ erro: MES_INVALIDO }, 422)

  const m = await carregarMinisterio(c.env.DB, mes ? { mes } : {})
  const eu = c.get('membro')

  return c.json({ escalas: m.escalas.map((escala) => resumirEscala(m, escala, eu.id)) })
})

escalas.post('/api/escalas/mes', exigirMinistro, async (c) => {
  const { mes } = await corpoJson<{ mes?: unknown }>(c.req.raw)
  if (!ehMes(mes)) return c.json({ erro: MES_INVALIDO }, 422)

  const [ano, numero] = mes.split('-').map(Number)
  const domingos = domingosDoMes(ano, numero)
  const existentes = await datasJaCriadas(c.env.DB, domingos)

  const ceia = domingoDaSantaCeia(domingos)
  const som = unicoDoSom(await carregarMinisterio(c.env.DB, { ids: [] }))

  for (const data of domingos) {
    if (existentes.includes(data)) continue

    const santaCeia = data === ceia
    const id = await criarEscala(c.env.DB, {
      data,
      horario: santaCeia ? HORARIO_DA_SANTA_CEIA : HORARIO_DE_DOMINGO,
      rotulo: ROTULO_DE_DOMINGO,
      santaCeia,
    })

    if (som) await definirEntradaDaEquipe(c.env.DB, id, som)
  }

  const m = await carregarMinisterio(c.env.DB, { mes })
  const criadas = m.escalas.filter((escala) => !existentes.includes(escala.data))
  const eu = c.get('membro')

  return c.json({ criadas: criadas.map((escala) => resumirEscala(m, escala, eu.id)), existentes }, 201)
})

escalas.post('/api/escalas', exigirMinistro, async (c) => {
  const corpo = await corpoJson<{ data?: unknown; horario?: unknown; rotulo?: unknown; santaCeia?: unknown }>(
    c.req.raw,
  )

  if (!ehData(corpo.data)) return c.json({ erro: DATA_INVALIDA }, 422)
  if (!ehHorario(corpo.horario)) return c.json({ erro: HORARIO_INVALIDO }, 422)
  if (!ehTextoCheio(corpo.rotulo)) return c.json({ erro: 'Dê um nome para a escala.' }, 422)

  const id = await criarEscala(c.env.DB, {
    data: corpo.data,
    horario: corpo.horario,
    rotulo: corpo.rotulo.trim(),
    santaCeia: corpo.santaCeia === true,
  })

  const som = unicoDoSom(await carregarMinisterio(c.env.DB, { ids: [] }))
  if (som) await definirEntradaDaEquipe(c.env.DB, id, som)

  return c.json(await responderEscala(c.env.DB, id), 201)
})

escalas.get('/api/escalas/:id', exigirMembro, async (c) => {
  const resposta = await responderEscala(c.env.DB, c.req.param('id'))

  return resposta ? c.json(resposta) : c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)
})

escalas.patch('/api/escalas/:id', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  if (!m.escalas.length) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const corpo = await corpoJson<{ data?: unknown; horario?: unknown; rotulo?: unknown; santaCeia?: unknown }>(
    c.req.raw,
  )

  if (corpo.data !== undefined && !ehData(corpo.data)) return c.json({ erro: DATA_INVALIDA }, 422)
  if (corpo.horario !== undefined && !ehHorario(corpo.horario)) return c.json({ erro: HORARIO_INVALIDO }, 422)
  if (corpo.rotulo !== undefined && !ehTextoCheio(corpo.rotulo)) {
    return c.json({ erro: 'Dê um nome para a escala.' }, 422)
  }
  if (corpo.santaCeia !== undefined && typeof corpo.santaCeia !== 'boolean') {
    return c.json({ erro: 'A marca de Santa Ceia é sim ou não.' }, 422)
  }

  await atualizarEscala(c.env.DB, id, {
    data: corpo.data as string | undefined,
    horario: corpo.horario as string | undefined,
    rotulo: typeof corpo.rotulo === 'string' ? corpo.rotulo.trim() : undefined,
    santaCeia: corpo.santaCeia as boolean | undefined,
  })

  const depois = await carregarMinisterio(c.env.DB, { ids: [id] })
  if (remarcou(m.escalas[0], depois.escalas[0])) {
    await avisarRemarcada(c.env.DB, m, m.escalas[0], depois.escalas[0], new Date())
  }

  return c.json(await responderEscala(c.env.DB, id))
})

escalas.post('/api/escalas/:id/cancelar', exigirMinistro, (c) => marcarCancelada(c, c.req.param('id'), true))

escalas.post('/api/escalas/:id/desfazer', exigirMinistro, (c) => marcarCancelada(c, c.req.param('id'), false))

escalas.put('/api/escalas/:id/equipe/:membroId', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const membro = m.membros.find((x) => x.id === c.req.param('membroId'))
  if (!membro) return c.json({ erro: 'Membro não encontrado.' }, 404)

  const corpo = await corpoJson<{ funcoes?: unknown; ministro?: unknown }>(c.req.raw)
  const anterior = escala.equipe.find((x) => x.membroId === membro.id)
  const funcoes = corpo.funcoes === undefined ? (anterior?.funcoes ?? []) : corpo.funcoes
  const ministro = corpo.ministro === undefined ? (anterior?.ministro ?? false) : corpo.ministro

  if (!ehListaDeTextos(funcoes)) return c.json({ erro: 'Envie a lista de funções.' }, 422)
  if (typeof ministro !== 'boolean') return c.json({ erro: 'A marca de ministro é sim ou não.' }, 422)

  const desconhecida = funcoes.find((funcaoId) => !m.funcoes.some((f) => f.id === funcaoId))
  if (desconhecida) return c.json({ erro: `Função desconhecida: ${desconhecida}.` }, 422)

  if (ministro && !membro.ministro && !membro.admin) {
    return c.json({ erro: `${membro.nome} não tem o papel de ministro. Só um admin pode dar esse papel.` }, 422)
  }

  await definirEntradaDaEquipe(c.env.DB, id, { membroId: membro.id, funcoes: [...new Set(funcoes)], ministro })

  const depois = await carregarMinisterio(c.env.DB, { ids: [id] })
  await avisarEscalados(c.env.DB, depois, depois.escalas[0], [membro.id], new Date())

  return c.json(await responderEscala(c.env.DB, id))
})

escalas.delete('/api/escalas/:id/equipe/:membroId', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  if (!m.escalas.length) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  await tirarDaEquipe(c.env.DB, id, c.req.param('membroId'))

  return c.json(await responderEscala(c.env.DB, id))
})

escalas.get('/api/escalas/:id/whatsapp', exigirMembro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  if (!m.escalas.length) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  return c.json({ texto: textoParaWhatsApp(m, id) })
})

escalas.get('/api/escalas/:id/playlist', exigirMembro, async (c) => {
  const id = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const pedidos = videosDaPlaylist(m, escala)
  const agora = new Date()
  const { confirmados, aReconferir } = await conferirVideos(c.env.DB, pedidos, agora)

  if (aReconferir.length) c.executionCtx.waitUntil(reconferirVideos(c.env.DB, aReconferir, agora))

  return c.json({
    link: linkDeVideos(confirmados),
    videoIds: confirmados,
    ignorados: pedidos.filter((videoId) => !confirmados.includes(videoId)),
  })
})

async function marcarCancelada(c: Context<Contexto>, id: string, cancelada: boolean) {
  const m = await carregarMinisterio(c.env.DB, { ids: [id] })
  if (!m.escalas.length) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  await definirCancelada(c.env.DB, id, cancelada)

  if (cancelada) await avisarCancelada(c.env.DB, m, m.escalas[0], new Date())

  return c.json(await responderEscala(c.env.DB, id))
}

function remarcou(antes: Escala, depois: Escala): boolean {
  return antes.data !== depois.data || antes.horario !== depois.horario
}

const MES_INVALIDO = 'Informe o mês no formato 2026-09.'
const DATA_INVALIDA = 'Informe a data no formato 2026-09-13.'
const HORARIO_INVALIDO = 'Informe o horário no formato 18:00.'
const ESCALA_NAO_ENCONTRADA = 'Escala não encontrada.'
