import type { EntradaEquipe } from '../../src/dominio'

export type NovaEscala = {
  data: string
  horario: string
  rotulo: string
  santaCeia?: boolean
}

export type CamposDaEscala = {
  data?: string
  horario?: string
  rotulo?: string
  santaCeia?: boolean
}

export const ROTULO_DE_DOMINGO = 'Culto de Domingo'
export const HORARIO_DE_DOMINGO = '18:00'
export const HORARIO_DA_SANTA_CEIA = '08:00'

export async function criarEscala(db: D1Database, nova: NovaEscala): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      'insert into escalas (id, data, horario, rotulo, santa_ceia, cancelada, criado_em) values (?, ?, ?, ?, ?, 0, ?)',
    )
    .bind(id, nova.data, nova.horario, nova.rotulo, nova.santaCeia ? 1 : 0, agora())
    .run()

  return id
}

export async function datasJaCriadas(db: D1Database, datas: string[]): Promise<string[]> {
  if (!datas.length) return []

  const { results } = await db
    .prepare(`select distinct data from escalas where data in (${datas.map(() => '?').join(', ')})`)
    .bind(...datas)
    .all<{ data: string }>()

  return results.map((linha) => linha.data)
}

export async function atualizarEscala(db: D1Database, id: string, campos: CamposDaEscala): Promise<void> {
  const colunas: Record<string, string | number> = {}

  if (campos.data !== undefined) colunas.data = campos.data
  if (campos.horario !== undefined) colunas.horario = campos.horario
  if (campos.rotulo !== undefined) colunas.rotulo = campos.rotulo
  if (campos.santaCeia !== undefined) colunas.santa_ceia = campos.santaCeia ? 1 : 0

  const nomes = Object.keys(colunas)
  if (!nomes.length) return

  await db
    .prepare(`update escalas set ${nomes.map((nome) => nome + ' = ?').join(', ')} where id = ?`)
    .bind(...nomes.map((nome) => colunas[nome]), id)
    .run()
}

export async function definirCancelada(db: D1Database, id: string, cancelada: boolean): Promise<void> {
  await db
    .prepare('update escalas set cancelada = ? where id = ?')
    .bind(cancelada ? 1 : 0, id)
    .run()
}

export async function definirEntradaDaEquipe(
  db: D1Database,
  escalaId: string,
  entrada: EntradaEquipe,
): Promise<void> {
  const comandos = [
    db
      .prepare('delete from equipe_funcoes where escala_id = ? and membro_id = ?')
      .bind(escalaId, entrada.membroId),
    db
      .prepare(
        'insert into equipe_membros (escala_id, membro_id, ministro) values (?, ?, ?) on conflict (escala_id, membro_id) do update set ministro = excluded.ministro',
      )
      .bind(escalaId, entrada.membroId, entrada.ministro ? 1 : 0),
    ...entrada.funcoes.map((funcaoId) =>
      db
        .prepare('insert into equipe_funcoes (escala_id, membro_id, funcao_id) values (?, ?, ?)')
        .bind(escalaId, entrada.membroId, funcaoId),
    ),
  ]

  await db.batch(comandos)
}

export async function tirarDaEquipe(db: D1Database, escalaId: string, membroId: string): Promise<void> {
  await db
    .prepare('delete from equipe_membros where escala_id = ? and membro_id = ?')
    .bind(escalaId, membroId)
    .run()
}

function agora(): string {
  return new Date().toISOString()
}
