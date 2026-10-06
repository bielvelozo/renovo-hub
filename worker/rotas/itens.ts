import { Hono } from 'hono'
import { descricaoDaMudanca, ministradoPorDe, ministros, musicaPorId } from '../../src/dominio'
import type { Escala, Item, Ministerio, Trecho } from '../../src/dominio'
import { exigirMinistro } from '../autenticacao'
import { atualizarItem, criarItem, removerItem, reordenarItens, trocarTrechos } from '../dados/itens'
import type { NovoItem, TrechoNovo } from '../dados/itens'
import { carregarMinisterio } from '../dados/ministerio'
import { responderEscala } from '../http/responder'
import { corpoJson, ehMinutagem, ehTextoCheio } from '../http/validacao'
import { avisarMudancaDeMusica } from '../push/gatilhos'
import type { Contexto } from '../tipos'

export const itens = new Hono<Contexto>()

itens.post('/api/escalas/:id/itens', exigirMinistro, async (c) => {
  const escalaId = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const novo = lerNovoItem(m, corpo)
  if (typeof novo === 'string') return c.json({ erro: novo }, 422)

  const marca = lerMinistradoPor(escala, corpo.ministradoPor)
  if ('erro' in marca) return c.json({ erro: marca.erro }, 422)

  const itemId = await criarItem(c.env.DB, escalaId, novo, { ministradoPor: marca.quem })
  const depois = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const criado = depois.escalas[0].itens.find((x) => x.id === itemId)

  if (criado) {
    await avisarMudancaDeMusica(
      c.env.DB,
      depois,
      depois.escalas[0],
      { acao: 'entrou', descricao: descricaoDaMudanca(depois, criado) },
      c.get('membro').id,
      new Date(),
    )
  }

  return c.json(await responderEscala(c.env.DB, escalaId), 201)
})

itens.patch('/api/escalas/:id/itens/:itemId', exigirMinistro, async (c) => {
  const escalaId = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const item = escala.itens.find((x) => x.id === c.req.param('itemId'))
  if (!item) return c.json({ erro: ITEM_NAO_ENCONTRADO }, 404)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  const recusa = conferirEdicao(m, item, corpo)
  if (recusa) return c.json({ erro: recusa }, 422)

  const marca = corpo.ministradoPor === undefined ? null : lerMinistradoPor(escala, corpo.ministradoPor)
  if (marca && 'erro' in marca) return c.json({ erro: marca.erro }, 422)

  await atualizarItem(c.env.DB, item.id, {
    tipo: corpo.tipo as 'inteira' | 'trecho' | undefined,
    tom: corpo.tom as string | undefined,
    inicio: corpo.inicio as string | undefined,
    fim: corpo.fim as string | undefined,
    observacao: typeof corpo.observacao === 'string' ? corpo.observacao.trim() : undefined,
    ministradoPor: marca && 'quem' in marca ? marca.quem : undefined,
  })

  if (corpo.trechos !== undefined) await trocarTrechos(c.env.DB, item.id, corpo.trechos as TrechoNovo[])

  if (corpo.ordem !== undefined) {
    await reordenarItens(c.env.DB, comOItemNaPosicao(escala, item.id, corpo.ordem as number))
  }

  const depois = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const editado = depois.escalas[0].itens.find((x) => x.id === item.id)

  if (mexeuNaMusica(corpo) && editado) {
    await avisarMudancaDeMusica(
      c.env.DB,
      depois,
      depois.escalas[0],
      { acao: 'mudou', descricao: descricaoDaMudanca(depois, editado) },
      c.get('membro').id,
      new Date(),
    )
  }

  return c.json(await responderEscala(c.env.DB, escalaId))
})

itens.delete('/api/escalas/:id/itens/:itemId', exigirMinistro, async (c) => {
  const escalaId = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: ESCALA_NAO_ENCONTRADA }, 404)

  const item = escala.itens.find((x) => x.id === c.req.param('itemId'))
  if (!item) return c.json({ erro: ITEM_NAO_ENCONTRADO }, 404)

  const descricao = descricaoDaMudanca(m, item)

  await removerItem(c.env.DB, item.id)
  await reordenarItens(c.env.DB, escala.itens.filter((x) => x.id !== item.id).map((x) => x.id))

  await avisarMudancaDeMusica(
    c.env.DB,
    m,
    escala,
    { acao: 'saiu', descricao },
    c.get('membro').id,
    new Date(),
  )

  return c.json(await responderEscala(c.env.DB, escalaId))
})

export function lerNovoItem(m: Ministerio, corpo: Record<string, unknown>): NovoItem | string {
  const observacao = typeof corpo.observacao === 'string' ? corpo.observacao.trim() : ''

  if (corpo.tipo === 'medley') {
    const trechos = lerTrechos(m, corpo.trechos)
    return typeof trechos === 'string' ? trechos : { tipo: 'medley', trechos, observacao }
  }

  if (corpo.tipo !== 'inteira' && corpo.tipo !== 'trecho') return 'Um Item é uma Música inteira, um Trecho ou um Medley.'

  const recusa = conferirMusica(m, corpo.musicaId)
  if (recusa) return recusa
  if (!ehTextoCheio(corpo.tom)) return TOM_OBRIGATORIO

  const musicaId = corpo.musicaId as string
  if (corpo.tipo === 'inteira') return { tipo: 'inteira', musicaId, tom: corpo.tom.trim(), observacao }

  if (!ehMinutagem(corpo.inicio) || !ehMinutagem(corpo.fim)) return MINUTAGEM_INVALIDA

  return { tipo: 'trecho', musicaId, tom: corpo.tom.trim(), inicio: corpo.inicio, fim: corpo.fim, observacao }
}

function lerTrechos(m: Ministerio, valor: unknown): TrechoNovo[] | string {
  if (!Array.isArray(valor) || valor.length < 2) return 'Um Medley precisa de pelo menos dois Trechos.'

  const trechos: TrechoNovo[] = []

  for (const bruto of valor) {
    if (!bruto || typeof bruto !== 'object') return TRECHO_INVALIDO
    const { musicaId, tom, inicio, fim } = bruto as Record<string, unknown>

    const recusa = conferirMusica(m, musicaId)
    if (recusa) return recusa
    if (!ehTextoCheio(tom)) return TOM_OBRIGATORIO
    if (!ehMinutagem(inicio) || !ehMinutagem(fim)) return MINUTAGEM_INVALIDA

    trechos.push({ musicaId: musicaId as string, tom: tom.trim(), inicio, fim })
  }

  return trechos
}

function conferirMusica(m: Ministerio, musicaId: unknown): string | null {
  if (typeof musicaId !== 'string' || !m.musicas.some((x) => x.id === musicaId)) {
    return `Música desconhecida: ${String(musicaId)}.`
  }

  const musica = musicaPorId(m, musicaId)

  return musica.arquivada ? `${musica.titulo} está arquivada e não entra em Repertório.` : null
}

export function lerMinistradoPor(escala: Escala, valor: unknown): { quem: string | null } | { erro: string } {
  if (valor === undefined || valor === null) return { quem: ministradoPorDe(escala, null) }
  if (typeof valor !== 'string' || !ministros(escala).includes(valor)) {
    return { erro: 'Ministrado por só pode ser um Ministro marcado nessa Escala.' }
  }
  return { quem: valor }
}

function conferirEdicao(m: Ministerio, item: Item, corpo: Record<string, unknown>): string | null {
  if (corpo.ordem !== undefined && (!Number.isInteger(corpo.ordem) || (corpo.ordem as number) < 0)) {
    return 'A posição no Repertório é um número a partir de zero.'
  }

  if (corpo.observacao !== undefined && typeof corpo.observacao !== 'string') return 'A observação é um texto.'

  if (corpo.tipo !== undefined && corpo.tipo !== 'inteira' && corpo.tipo !== 'trecho') {
    return 'Um Item vira Música inteira ou Trecho.'
  }

  if (item.tipo === 'medley') {
    if (corpo.tipo !== undefined) return MEDLEY_NAO_TROCA
    if (corpo.tom !== undefined || corpo.inicio !== undefined || corpo.fim !== undefined) {
      return 'O Medley não tem Tom próprio: cada Trecho tem o seu.'
    }
    if (corpo.trechos !== undefined) {
      const trechos = lerTrechos(m, corpo.trechos)
      if (typeof trechos === 'string') return trechos
      if (!mesmasMusicas(item.trechos, trechos)) return MUSICAS_DO_MEDLEY
    }
    return null
  }

  if (corpo.trechos !== undefined) return 'Só um Medley tem Trechos.'
  if (corpo.tom !== undefined && !ehTextoCheio(corpo.tom)) return TOM_OBRIGATORIO

  const tipo = (corpo.tipo as 'inteira' | 'trecho' | undefined) ?? item.tipo

  if (tipo === 'inteira' && (corpo.inicio !== undefined || corpo.fim !== undefined)) {
    return 'Uma Música inteira não tem minutagem.'
  }

  if (corpo.inicio !== undefined && !ehMinutagem(corpo.inicio)) return MINUTAGEM_INVALIDA
  if (corpo.fim !== undefined && !ehMinutagem(corpo.fim)) return MINUTAGEM_INVALIDA

  if (tipo === 'trecho' && item.tipo === 'inteira' && (corpo.inicio === undefined || corpo.fim === undefined)) {
    return 'Um Trecho precisa de início e fim.'
  }

  return null
}

function mesmasMusicas(atuais: Trecho[], novos: TrechoNovo[]): boolean {
  return (
    atuais.length === novos.length && atuais.every((trecho, i) => trecho.musicaId === novos[i].musicaId)
  )
}

function mexeuNaMusica(corpo: Record<string, unknown>): boolean {
  return ['tipo', 'tom', 'inicio', 'fim', 'observacao', 'trechos', 'ministradoPor'].some(
    (campo) => corpo[campo] !== undefined,
  )
}

function comOItemNaPosicao(escala: Escala, itemId: string, posicao: number): string[] {
  const outros = escala.itens.map((x) => x.id).filter((id) => id !== itemId)
  outros.splice(Math.min(posicao, outros.length), 0, itemId)
  return outros
}

const TOM_OBRIGATORIO = 'Escolha o Tom.'
const MINUTAGEM_INVALIDA = 'Informe a minutagem no formato 1:05.'
const TRECHO_INVALIDO = 'Cada Trecho precisa de Música, Tom e minutagem.'
const MEDLEY_NAO_TROCA = 'O Medley não vira Música inteira nem Trecho.'
const MUSICAS_DO_MEDLEY = 'Para trocar as músicas, remova o Medley e monte de novo.'
const ESCALA_NAO_ENCONTRADA = 'Escala não encontrada.'
const ITEM_NAO_ENCONTRADO = 'Item não encontrado nessa Escala.'
