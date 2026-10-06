export type NovoMembro = {
  nome: string
  ministro: boolean
  admin: boolean
}

export type CamposDoMembro = {
  nome?: string
  ministro?: boolean
  admin?: boolean
  inativo?: boolean
}

export type AcessoDoMembro = {
  sessoes: number
  convites: number
  convitesUsados: number
  push: number
}

export async function criarMembro(db: D1Database, novo: NovoMembro): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare('insert into membros (id, nome, admin, ministro, inativo, criado_em) values (?, ?, ?, ?, 0, ?)')
    .bind(id, novo.nome, novo.admin ? 1 : 0, novo.ministro ? 1 : 0, new Date().toISOString())
    .run()

  return id
}

export async function atualizarMembro(db: D1Database, id: string, campos: CamposDoMembro): Promise<void> {
  const colunas: Record<string, string | number> = {}

  if (campos.nome !== undefined) colunas.nome = campos.nome
  if (campos.ministro !== undefined) colunas.ministro = campos.ministro ? 1 : 0
  if (campos.admin !== undefined) colunas.admin = campos.admin ? 1 : 0
  if (campos.inativo !== undefined) colunas.inativo = campos.inativo ? 1 : 0

  const nomes = Object.keys(colunas)
  if (!nomes.length) return

  await db
    .prepare(`update membros set ${nomes.map((nome) => nome + ' = ?').join(', ')} where id = ?`)
    .bind(...nomes.map((nome) => colunas[nome]), id)
    .run()
}

export async function definirFuncoesDoMembro(db: D1Database, id: string, funcoes: string[]): Promise<void> {
  await db.batch([
    db.prepare('delete from membro_funcoes where membro_id = ?').bind(id),
    ...funcoes.map((funcaoId) =>
      db.prepare('insert into membro_funcoes (membro_id, funcao_id) values (?, ?)').bind(id, funcaoId),
    ),
  ])
}

export async function serviuEmEscalaRealizada(db: D1Database, id: string, hoje: string): Promise<boolean> {
  const linha = await db
    .prepare(
      'select count(*) as n from equipe_membros em join escalas e on e.id = em.escala_id where em.membro_id = ? and e.cancelada = 0 and e.data < ?',
    )
    .bind(id, hoje)
    .first<{ n: number }>()

  return (linha?.n ?? 0) > 0
}

export async function apagarMembro(db: D1Database, id: string): Promise<void> {
  await db.prepare('delete from membros where id = ?').bind(id).run()
}

export async function desativarMembro(db: D1Database, id: string, hoje: string): Promise<void> {
  await db.batch([
    db.prepare('update membros set inativo = 1 where id = ?').bind(id),
    db.prepare('delete from sessoes where membro_id = ?').bind(id),
    db.prepare('delete from convites where membro_id = ?').bind(id),
    db.prepare('delete from push_inscricoes where membro_id = ?').bind(id),
    db.prepare('delete from formacao_entradas where membro_id = ?').bind(id),
    db
      .prepare(
        'delete from equipe_membros where membro_id = ? and escala_id in (select id from escalas where cancelada = 0 and data >= ?)',
      )
      .bind(id, hoje),
  ])
}

export async function acessoDosMembros(db: D1Database): Promise<Map<string, AcessoDoMembro>> {
  const [sessoes, convites, push] = await Promise.all([
    contar(db, 'select membro_id, count(*) as n from sessoes group by membro_id'),
    db
      .prepare(
        'select membro_id, count(*) as n, sum(case when usado_em is null then 0 else 1 end) as usados from convites group by membro_id',
      )
      .all<{ membro_id: string; n: number; usados: number }>(),
    contar(db, 'select membro_id, count(*) as n from push_inscricoes group by membro_id'),
  ])

  const mapa = new Map<string, AcessoDoMembro>()

  const guardar = (id: string, campos: Partial<AcessoDoMembro>) => {
    mapa.set(id, { sessoes: 0, convites: 0, convitesUsados: 0, push: 0, ...mapa.get(id), ...campos })
  }

  for (const linha of sessoes) guardar(linha.membro_id, { sessoes: linha.n })
  for (const linha of convites.results) guardar(linha.membro_id, { convites: linha.n, convitesUsados: linha.usados })
  for (const linha of push) guardar(linha.membro_id, { push: linha.n })

  return mapa
}

async function contar(db: D1Database, sql: string): Promise<{ membro_id: string; n: number }[]> {
  const { results } = await db.prepare(sql).all<{ membro_id: string; n: number }>()
  return results
}
