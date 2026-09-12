import type { Grupo } from '../../src/dominio'

export type NovaFuncao = {
  nome: string
  grupo: Grupo
  ordem: number
  minimo: number
}

export type CamposDaFuncao = {
  nome?: string
  grupo?: Grupo
  ordem?: number
  minimo?: number
}

export const GRUPOS: Grupo[] = ['vocal', 'instrumentos', 'tecnica']

export function ehNaipe(valor: unknown): valor is Grupo {
  return GRUPOS.includes(valor as Grupo)
}

export async function criarFuncao(db: D1Database, nova: NovaFuncao): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare('insert into funcoes (id, nome, grupo, ordem, minimo) values (?, ?, ?, ?, ?)')
    .bind(id, nova.nome, nova.grupo, nova.ordem, nova.minimo)
    .run()

  return id
}

export async function atualizarFuncao(db: D1Database, id: string, campos: CamposDaFuncao): Promise<void> {
  const colunas: Record<string, string | number> = {}

  if (campos.nome !== undefined) colunas.nome = campos.nome
  if (campos.grupo !== undefined) colunas.grupo = campos.grupo
  if (campos.ordem !== undefined) colunas.ordem = campos.ordem
  if (campos.minimo !== undefined) colunas.minimo = campos.minimo

  const nomes = Object.keys(colunas)
  if (!nomes.length) return

  await db
    .prepare(`update funcoes set ${nomes.map((nome) => nome + ' = ?').join(', ')} where id = ?`)
    .bind(...nomes.map((nome) => colunas[nome]), id)
    .run()
}

export async function funcaoEmAlgumaEquipe(db: D1Database, id: string): Promise<boolean> {
  const linha = await db
    .prepare('select count(*) as n from equipe_funcoes where funcao_id = ?')
    .bind(id)
    .first<{ n: number }>()

  return (linha?.n ?? 0) > 0
}

export async function apagarFuncao(db: D1Database, id: string): Promise<void> {
  await db.prepare('delete from funcoes where id = ?').bind(id).run()
}
