export type Inscricao = {
  id: string
  membroId: string
  endpoint: string
  p256dh: string
  auth: string
}

export type NovaInscricao = {
  endpoint: string
  p256dh: string
  auth: string
}

type LinhaDeInscricao = {
  id: string
  membro_id: string
  endpoint: string
  p256dh: string
  auth: string
}

export async function guardarInscricao(db: D1Database, membroId: string, nova: NovaInscricao): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      `insert into push_inscricoes (id, membro_id, endpoint, p256dh, auth, criado_em) values (?, ?, ?, ?, ?, ?)
       on conflict (endpoint) do update set membro_id = excluded.membro_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
    .bind(id, membroId, nova.endpoint, nova.p256dh, nova.auth, new Date().toISOString())
    .run()

  const linha = await db
    .prepare('select id from push_inscricoes where endpoint = ?')
    .bind(nova.endpoint)
    .first<{ id: string }>()

  return linha?.id ?? id
}

export async function apagarInscricaoPorEndpoint(db: D1Database, endpoint: string): Promise<void> {
  await db.prepare('delete from push_inscricoes where endpoint = ?').bind(endpoint).run()
}

export async function apagarInscricao(db: D1Database, id: string): Promise<void> {
  await db.prepare('delete from push_inscricoes where id = ?').bind(id).run()
}

export async function inscricoesDe(db: D1Database, membroId: string): Promise<Inscricao[]> {
  const { results } = await db
    .prepare('select id, membro_id, endpoint, p256dh, auth from push_inscricoes where membro_id = ? order by criado_em')
    .bind(membroId)
    .all<LinhaDeInscricao>()

  return results.map(comoInscricao)
}

export async function inscricoesDeMembros(db: D1Database, membroIds: string[]): Promise<Inscricao[]> {
  if (!membroIds.length) return []

  const { results } = await db
    .prepare(
      `select id, membro_id, endpoint, p256dh, auth from push_inscricoes where membro_id in (${lugares(membroIds)})`,
    )
    .bind(...membroIds)
    .all<LinhaDeInscricao>()

  return results.map(comoInscricao)
}

export async function contarInscricoes(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db
    .prepare('select membro_id, count(*) as n from push_inscricoes group by membro_id')
    .all<{ membro_id: string; n: number }>()

  return new Map(results.map((linha) => [linha.membro_id, linha.n]))
}

export async function definirSilenciado(db: D1Database, membroId: string, silenciado: boolean): Promise<void> {
  await db
    .prepare('update membros set silenciado = ? where id = ?')
    .bind(silenciado ? 1 : 0, membroId)
    .run()
}

export async function estaSilenciado(db: D1Database, membroId: string): Promise<boolean> {
  const linha = await db
    .prepare('select silenciado from membros where id = ?')
    .bind(membroId)
    .first<{ silenciado: number }>()

  return linha?.silenciado === 1
}

export async function silenciados(db: D1Database): Promise<Set<string>> {
  const { results } = await db.prepare('select id from membros where silenciado = 1').all<{ id: string }>()

  return new Set(results.map((linha) => linha.id))
}

function comoInscricao(linha: LinhaDeInscricao): Inscricao {
  return {
    id: linha.id,
    membroId: linha.membro_id,
    endpoint: linha.endpoint,
    p256dh: linha.p256dh,
    auth: linha.auth,
  }
}

function lugares(valores: unknown[]): string {
  return valores.map(() => '?').join(', ')
}
