import { Hono } from 'hono'
import { daFormacao } from '../../src/dominio'
import type { Ministerio } from '../../src/dominio'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import { definirEntradaDaEquipe } from '../dados/escalas'
import {
  apagarFormacao,
  criarFormacao,
  lerFormacao,
  lerFormacoes,
  renomearFormacao,
  trocarEntradas,
} from '../dados/formacoes'
import type { EntradaDaFormacao } from '../dados/formacoes'
import { carregarMinisterio } from '../dados/ministerio'
import { apresentarEscala } from '../http/escala'
import { avisarEscalados } from '../push/gatilhos'
import { corpoJson, ehListaDeTextos, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'

export const formacoes = new Hono<Contexto>()

formacoes.get('/api/formacoes', exigirMembro, async (c) => {
  return c.json({ formacoes: await lerFormacoes(c.env.DB) })
})

formacoes.post('/api/formacoes', exigirMinistro, async (c) => {
  const corpo = await corpoJson<{ nome?: unknown; escalaId?: unknown; entradas?: unknown }>(c.req.raw)

  if (!ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_OBRIGATORIO }, 422)

  const m = await carregarMinisterio(c.env.DB, {
    ids: typeof corpo.escalaId === 'string' ? [corpo.escalaId] : [],
  })

  if (typeof corpo.escalaId === 'string' && !m.escalas.length) {
    return c.json({ erro: 'Escala não encontrada.' }, 404)
  }

  const escala = m.escalas[0]
  const entradas = escala
    ? daFormacao(m, escala.equipe)
    : corpo.entradas === undefined
      ? []
      : lerEntradas(corpo.entradas)

  if (!entradas) return c.json({ erro: ENTRADAS_INVALIDAS }, 422)

  const recusa = conferirEntradas(m, entradas)
  if (recusa) return c.json({ erro: recusa }, 422)

  const id = await criarFormacao(c.env.DB, corpo.nome.trim(), entradas)

  return c.json(await lerFormacao(c.env.DB, id), 201)
})

formacoes.patch('/api/formacoes/:id', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  const formacao = await lerFormacao(c.env.DB, id)
  if (!formacao) return c.json({ erro: FORMACAO_NAO_ENCONTRADA }, 404)

  const corpo = await corpoJson<{ nome?: unknown; entradas?: unknown }>(c.req.raw)

  if (corpo.nome !== undefined && !ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_OBRIGATORIO }, 422)

  if (corpo.entradas !== undefined) {
    const entradas = lerEntradas(corpo.entradas)
    if (!entradas) return c.json({ erro: ENTRADAS_INVALIDAS }, 422)

    const recusa = conferirEntradas(await carregarMinisterio(c.env.DB, { ids: [] }), entradas)
    if (recusa) return c.json({ erro: recusa }, 422)

    await trocarEntradas(c.env.DB, id, entradas)
  }

  if (typeof corpo.nome === 'string') await renomearFormacao(c.env.DB, id, corpo.nome.trim())

  return c.json(await lerFormacao(c.env.DB, id))
})

formacoes.delete('/api/formacoes/:id', exigirMinistro, async (c) => {
  const id = c.req.param('id')
  if (!(await lerFormacao(c.env.DB, id))) return c.json({ erro: FORMACAO_NAO_ENCONTRADA }, 404)

  await apagarFormacao(c.env.DB, id)

  return c.json({ apagada: true })
})

formacoes.post('/api/escalas/:id/formacao', exigirMinistro, async (c) => {
  const escalaId = c.req.param('id')
  const m = await carregarMinisterio(c.env.DB, { ids: [escalaId] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: 'Escala não encontrada.' }, 404)

  const { formacaoId } = await corpoJson<{ formacaoId?: unknown }>(c.req.raw)
  const formacao = typeof formacaoId === 'string' ? await lerFormacao(c.env.DB, formacaoId) : null
  if (!formacao) return c.json({ erro: FORMACAO_NAO_ENCONTRADA }, 404)

  for (const entrada of formacao.entradas) {
    const atual = escala.equipe.find((x) => x.membroId === entrada.membroId)

    await definirEntradaDaEquipe(c.env.DB, escalaId, {
      membroId: entrada.membroId,
      funcoes: [...new Set([...(atual?.funcoes ?? []), ...entrada.funcoes])],
      ministro: atual?.ministro ?? false,
    })
  }

  const depois = await carregarMinisterio(c.env.DB, { ids: [escalaId] })

  await avisarEscalados(
    c.env.DB,
    depois,
    depois.escalas[0],
    formacao.entradas.map((entrada) => entrada.membroId),
    new Date(),
  )

  return c.json(apresentarEscala(depois, depois.escalas[0]))
})

function lerEntradas(valor: unknown): EntradaDaFormacao[] | null {
  if (!Array.isArray(valor)) return null

  const entradas: EntradaDaFormacao[] = []

  for (const item of valor) {
    if (!item || typeof item !== 'object') return null
    const { membroId, funcoes } = item as { membroId?: unknown; funcoes?: unknown }
    if (typeof membroId !== 'string' || !ehListaDeTextos(funcoes)) return null
    entradas.push({ membroId, funcoes: [...new Set(funcoes)] })
  }

  return entradas
}

function conferirEntradas(m: Ministerio, entradas: EntradaDaFormacao[]): string | null {
  for (const entrada of entradas) {
    if (!m.membros.some((membro) => membro.id === entrada.membroId)) {
      return `Membro desconhecido: ${entrada.membroId}.`
    }

    for (const funcaoId of entrada.funcoes) {
      const funcao = m.funcoes.find((f) => f.id === funcaoId)
      if (!funcao) return `Função desconhecida: ${funcaoId}.`
      if (funcao.grupo !== 'instrumentos') return FORMACAO_SO_DE_MUSICOS
    }
  }

  return null
}

const NOME_OBRIGATORIO = 'Dê um nome para a Formação.'
const ENTRADAS_INVALIDAS = 'Cada entrada da Formação precisa de membroId e da lista de Funções.'
const FORMACAO_SO_DE_MUSICOS = 'A Formação guarda só os Músicos.'
const FORMACAO_NAO_ENCONTRADA = 'Formação não encontrada.'
