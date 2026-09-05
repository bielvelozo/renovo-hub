import { Hono } from 'hono'
import { hojeEmBrasilia } from '../../src/dominio'
import type { Funcao, Membro } from '../../src/dominio'
import { exigirAdmin, exigirMembro } from '../autenticacao'
import { definirListaEsqueci, listaEsqueciLigada } from '../dados/acesso'
import { apagarFuncao, atualizarFuncao, criarFuncao, ehNaipe, funcaoEmAlgumaEquipe } from '../dados/funcoes'
import {
  acessoDosMembros,
  apagarMembro,
  atualizarMembro,
  criarMembro,
  definirFuncoesDoMembro,
  desativarMembro,
  serviuEmEscalaRealizada,
} from '../dados/membros'
import { lerFuncoes, lerMembros } from '../dados/ministerio'
import { corpoJson, ehListaDeTextos, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'

export const admin = new Hono<Contexto>()

admin.get('/api/membros', exigirMembro, async (c) => {
  const membros = await lerMembros(c.env.DB)

  return c.json({ membros: membros.filter((membro) => !membro.inativo) })
})

admin.get('/api/funcoes', exigirMembro, async (c) => {
  return c.json({ funcoes: await lerFuncoes(c.env.DB) })
})

admin.get('/api/admin/membros', exigirAdmin, async (c) => {
  const [membros, acesso] = await Promise.all([lerMembros(c.env.DB), acessoDosMembros(c.env.DB)])

  return c.json({
    membros: membros.map((membro) => ({
      ...membro,
      sessoes: acesso.get(membro.id)?.sessoes ?? 0,
      convites: acesso.get(membro.id)?.convites ?? 0,
      convitesUsados: acesso.get(membro.id)?.convitesUsados ?? 0,
      push: acesso.get(membro.id)?.push ?? 0,
    })),
  })
})

admin.post('/api/admin/membros', exigirAdmin, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  if (!ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_DO_MEMBRO }, 422)

  const funcoes = await lerFuncoesPedidas(c.env.DB, corpo.funcoes)
  if (typeof funcoes === 'string') return c.json({ erro: funcoes }, 422)

  const id = await criarMembro(c.env.DB, {
    nome: corpo.nome.trim(),
    ministro: corpo.ministro === true,
    admin: corpo.admin === true,
  })

  if (funcoes.length) await definirFuncoesDoMembro(c.env.DB, id, funcoes)

  return c.json(await responderMembro(c.env.DB, id), 201)
})

admin.patch('/api/admin/membros/:id', exigirAdmin, async (c) => {
  const id = c.req.param('id')
  const membro = (await lerMembros(c.env.DB)).find((x) => x.id === id)
  if (!membro) return c.json({ erro: MEMBRO_NAO_ENCONTRADO }, 404)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  if (corpo.nome !== undefined && !ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_DO_MEMBRO }, 422)
  if (id === c.get('membro').id && corpo.admin === false) {
    return c.json({ erro: 'Você não pode tirar o próprio papel de Admin.' }, 422)
  }

  const funcoes = await lerFuncoesPedidas(c.env.DB, corpo.funcoes)
  if (typeof funcoes === 'string') return c.json({ erro: funcoes }, 422)

  await atualizarMembro(c.env.DB, id, {
    nome: typeof corpo.nome === 'string' ? corpo.nome.trim() : undefined,
    ministro: lerMarca(corpo.ministro),
    admin: lerMarca(corpo.admin),
    inativo: lerMarca(corpo.inativo),
  })

  if (corpo.funcoes !== undefined) await definirFuncoesDoMembro(c.env.DB, id, funcoes)

  return c.json(await responderMembro(c.env.DB, id))
})

admin.delete('/api/admin/membros/:id', exigirAdmin, async (c) => {
  const id = c.req.param('id')
  const membro = (await lerMembros(c.env.DB)).find((x) => x.id === id)
  if (!membro) return c.json({ erro: MEMBRO_NAO_ENCONTRADO }, 404)

  if (id === c.get('membro').id) return c.json({ erro: 'Você não pode remover a si mesmo.' }, 422)

  const hoje = hojeEmBrasilia()

  if (await serviuEmEscalaRealizada(c.env.DB, id, hoje)) {
    await desativarMembro(c.env.DB, id, hoje)
    return c.json({ apagado: false, membro: await responderMembro(c.env.DB, id) })
  }

  await apagarMembro(c.env.DB, id)

  return c.json({ apagado: true })
})

admin.post('/api/admin/funcoes', exigirAdmin, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  if (!ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_DA_FUNCAO }, 422)
  if (!ehNaipe(corpo.naipe)) return c.json({ erro: NAIPE_INVALIDO }, 422)
  if (corpo.ordem !== undefined && !Number.isInteger(corpo.ordem)) return c.json({ erro: ORDEM_INVALIDA }, 422)

  const id = await criarFuncao(c.env.DB, {
    nome: corpo.nome.trim(),
    naipe: corpo.naipe,
    ordem: (corpo.ordem as number | undefined) ?? 0,
  })

  return c.json(await responderFuncao(c.env.DB, id), 201)
})

admin.patch('/api/admin/funcoes/:id', exigirAdmin, async (c) => {
  const id = c.req.param('id')
  if (!(await responderFuncao(c.env.DB, id))) return c.json({ erro: FUNCAO_NAO_ENCONTRADA }, 404)

  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)
  if (corpo.nome !== undefined && !ehTextoCheio(corpo.nome)) return c.json({ erro: NOME_DA_FUNCAO }, 422)
  if (corpo.naipe !== undefined && !ehNaipe(corpo.naipe)) return c.json({ erro: NAIPE_INVALIDO }, 422)
  if (corpo.ordem !== undefined && !Number.isInteger(corpo.ordem)) return c.json({ erro: ORDEM_INVALIDA }, 422)

  await atualizarFuncao(c.env.DB, id, {
    nome: typeof corpo.nome === 'string' ? corpo.nome.trim() : undefined,
    naipe: ehNaipe(corpo.naipe) ? corpo.naipe : undefined,
    ordem: corpo.ordem as number | undefined,
  })

  return c.json(await responderFuncao(c.env.DB, id))
})

admin.delete('/api/admin/funcoes/:id', exigirAdmin, async (c) => {
  const id = c.req.param('id')
  const funcao = await responderFuncao(c.env.DB, id)
  if (!funcao) return c.json({ erro: FUNCAO_NAO_ENCONTRADA }, 404)

  if (await funcaoEmAlgumaEquipe(c.env.DB, id)) {
    return c.json({ erro: `${funcao.nome} já foi usada em Escalas. Edite em vez de apagar.` }, 409)
  }

  await apagarFuncao(c.env.DB, id)

  return c.json({ apagada: true })
})

admin.get('/api/admin/configuracoes', exigirAdmin, async (c) => {
  return c.json({ listaEsqueci: await listaEsqueciLigada(c.env.DB) })
})

admin.patch('/api/admin/configuracoes', exigirAdmin, async (c) => {
  const { listaEsqueci } = await corpoJson<{ listaEsqueci?: unknown }>(c.req.raw)

  if (typeof listaEsqueci !== 'boolean') return c.json({ erro: 'A lista do "esqueci" fica ligada ou desligada.' }, 422)

  await definirListaEsqueci(c.env.DB, listaEsqueci)

  return c.json({ listaEsqueci: await listaEsqueciLigada(c.env.DB) })
})

async function lerFuncoesPedidas(db: D1Database, valor: unknown): Promise<string[] | string> {
  if (valor === undefined) return []
  if (!ehListaDeTextos(valor)) return 'As Funções são uma lista de ids.'

  const conhecidas = await lerFuncoes(db)
  const desconhecida = valor.find((id) => !conhecidas.some((funcao) => funcao.id === id))

  return desconhecida ? `Função desconhecida: ${desconhecida}.` : [...new Set(valor)]
}

function lerMarca(valor: unknown): boolean | undefined {
  return typeof valor === 'boolean' ? valor : undefined
}

async function responderMembro(db: D1Database, id: string): Promise<Membro | undefined> {
  return (await lerMembros(db)).find((membro) => membro.id === id)
}

async function responderFuncao(db: D1Database, id: string): Promise<Funcao | undefined> {
  return (await lerFuncoes(db)).find((funcao) => funcao.id === id)
}

const NOME_DO_MEMBRO = 'O Membro precisa de um nome.'
const NOME_DA_FUNCAO = 'A Função precisa de um nome.'
const NAIPE_INVALIDO = 'O Naipe é vocal, instrumentos ou tecnica.'
const ORDEM_INVALIDA = 'A ordem da Função é um número inteiro.'
const MEMBRO_NAO_ENCONTRADO = 'Membro não encontrado.'
const FUNCAO_NAO_ENCONTRADA = 'Função não encontrada.'
