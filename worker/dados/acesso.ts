import type { Membro } from '../../src/dominio/tipos'

export const CHAVE_LISTA_ESQUECI = 'lista_esqueci'

type LinhaDeMembro = {
  id: string
  nome: string
  admin: number
  ministro: number
  inativo: number
}

export async function membroPorId(db: D1Database, id: string): Promise<Membro | null> {
  const linha = await db
    .prepare('select id, nome, admin, ministro, inativo from membros where id = ?')
    .bind(id)
    .first<LinhaDeMembro>()

  return linha ? await comFuncoes(db, linha) : null
}

export async function membroPorSessao(db: D1Database, token: string): Promise<Membro | null> {
  const linha = await db
    .prepare(
      'select m.id, m.nome, m.admin, m.ministro, m.inativo from sessoes s join membros m on m.id = s.membro_id where s.token = ? and m.inativo = 0',
    )
    .bind(token)
    .first<LinhaDeMembro>()

  return linha ? await comFuncoes(db, linha) : null
}

export async function listarMembros(db: D1Database): Promise<{ id: string; nome: string }[]> {
  const { results } = await db
    .prepare('select id, nome from membros where inativo = 0 order by nome')
    .all<{ id: string; nome: string }>()

  return results
}

export async function marcarUsoDaSessao(db: D1Database, token: string): Promise<void> {
  await db.prepare('update sessoes set ultimo_uso = ? where token = ?').bind(agora(), token).run()
}

export async function criarConvite(db: D1Database, membroId: string): Promise<string> {
  const token = crypto.randomUUID()

  await db
    .prepare('insert into convites (token, membro_id, criado_em) values (?, ?, ?)')
    .bind(token, membroId, agora())
    .run()

  return token
}

export async function usarConvite(db: D1Database, token: string): Promise<string | null> {
  const convite = await db
    .prepare('select membro_id from convites where token = ?')
    .bind(token)
    .first<{ membro_id: string }>()

  if (!convite) return null

  await db
    .prepare('update convites set usado_em = ? where token = ? and usado_em is null')
    .bind(agora(), token)
    .run()

  return convite.membro_id
}

export async function criarSessao(db: D1Database, membroId: string, dispositivo: string | null): Promise<string> {
  const token = crypto.randomUUID()
  const quando = agora()

  await db
    .prepare('insert into sessoes (token, membro_id, dispositivo, criado_em, ultimo_uso) values (?, ?, ?, ?, ?)')
    .bind(token, membroId, dispositivo, quando, quando)
    .run()

  return token
}

export async function encerrarSessao(db: D1Database, token: string): Promise<void> {
  await db.prepare('delete from sessoes where token = ?').bind(token).run()
}

export async function listaEsqueciLigada(db: D1Database): Promise<boolean> {
  const linha = await db
    .prepare('select valor from configuracoes where chave = ?')
    .bind(CHAVE_LISTA_ESQUECI)
    .first<{ valor: string }>()

  return linha ? linha.valor !== '0' : true
}

export async function definirListaEsqueci(db: D1Database, ligada: boolean): Promise<void> {
  if (ligada) {
    await db.prepare('delete from configuracoes where chave = ?').bind(CHAVE_LISTA_ESQUECI).run()
    return
  }

  await db
    .prepare('insert or replace into configuracoes (chave, valor) values (?, ?)')
    .bind(CHAVE_LISTA_ESQUECI, '0')
    .run()
}

async function comFuncoes(db: D1Database, linha: LinhaDeMembro): Promise<Membro> {
  const { results } = await db
    .prepare(
      'select f.id from membro_funcoes mf join funcoes f on f.id = mf.funcao_id where mf.membro_id = ? order by f.ordem, f.nome',
    )
    .bind(linha.id)
    .all<{ id: string }>()

  return {
    id: linha.id,
    nome: linha.nome,
    admin: linha.admin === 1,
    ministro: linha.ministro === 1,
    inativo: linha.inativo === 1,
    funcoes: results.map((funcao) => funcao.id),
  }
}

function agora(): string {
  return new Date().toISOString()
}
