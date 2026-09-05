import type { Naipe } from '../../src/dominio'

export type NovaFuncao = {
  nome: string
  naipe: Naipe
  ordem: number
}

export type CamposDaFuncao = {
  nome?: string
  naipe?: Naipe
  ordem?: number
}

export const NAIPES: Naipe[] = ['vocal', 'instrumentos', 'tecnica']

export function ehNaipe(valor: unknown): valor is Naipe {
  return NAIPES.includes(valor as Naipe)
}

export async function criarFuncao(db: D1Database, nova: NovaFuncao): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare('insert into funcoes (id, nome, naipe, ordem) values (?, ?, ?, ?)')
    .bind(id, nova.nome, nova.naipe, nova.ordem)
    .run()

  return id
}

export async function atualizarFuncao(db: D1Database, id: string, campos: CamposDaFuncao): Promise<void> {
  const colunas: Record<string, string | number> = {}

  if (campos.nome !== undefined) colunas.nome = campos.nome
  if (campos.naipe !== undefined) colunas.naipe = campos.naipe
  if (campos.ordem !== undefined) colunas.ordem = campos.ordem

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
