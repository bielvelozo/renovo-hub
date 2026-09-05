export type NovaSugestao = {
  membroId: string
  musicaId: string | null
  link: string | null
  titulo: string | null
  observacao: string
}

export type Sugestao = {
  id: string
  membroId: string
  musicaId: string | null
  link: string | null
  titulo: string | null
  observacao: string
  data: string
  promovidaEm: string | null
  apoios: string[]
}

type LinhaDeSugestao = {
  id: string
  membro_id: string
  musica_id: string | null
  link: string | null
  titulo: string | null
  observacao: string
  data: string
  promovida_em: string | null
}

export async function lerSugestoes(db: D1Database): Promise<Sugestao[]> {
  const { results } = await db
    .prepare(
      'select id, membro_id, musica_id, link, titulo, observacao, data, promovida_em from sugestoes order by data desc, rowid desc',
    )
    .all<LinhaDeSugestao>()

  if (!results.length) return []

  const { results: apoios } = await db
    .prepare(
      'select a.sugestao_id, a.membro_id from apoios a join membros m on m.id = a.membro_id order by m.nome',
    )
    .all<{ sugestao_id: string; membro_id: string }>()

  return results.map((linha) => ({
    id: linha.id,
    membroId: linha.membro_id,
    musicaId: linha.musica_id,
    link: linha.link,
    titulo: linha.titulo,
    observacao: linha.observacao,
    data: linha.data,
    promovidaEm: linha.promovida_em,
    apoios: apoios.filter((apoio) => apoio.sugestao_id === linha.id).map((apoio) => apoio.membro_id),
  }))
}

export async function lerSugestao(db: D1Database, id: string): Promise<Sugestao | null> {
  return (await lerSugestoes(db)).find((sugestao) => sugestao.id === id) ?? null
}

export async function criarSugestao(db: D1Database, nova: NovaSugestao): Promise<string> {
  const id = crypto.randomUUID()

  await db.batch([
    db
      .prepare(
        'insert into sugestoes (id, membro_id, musica_id, link, titulo, observacao, data) values (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, nova.membroId, nova.musicaId, nova.link, nova.titulo, nova.observacao, new Date().toISOString()),
    comandoDeApoio(db, id, nova.membroId),
  ])

  return id
}

export async function apoiar(db: D1Database, sugestaoId: string, membroId: string): Promise<void> {
  await comandoDeApoio(db, sugestaoId, membroId).run()
}

export async function desapoiar(db: D1Database, sugestaoId: string, membroId: string): Promise<void> {
  await db
    .prepare('delete from apoios where sugestao_id = ? and membro_id = ?')
    .bind(sugestaoId, membroId)
    .run()
}

export async function apagarSugestao(db: D1Database, id: string): Promise<void> {
  await db.prepare('delete from sugestoes where id = ?').bind(id).run()
}

export async function marcarPromovida(db: D1Database, id: string, musicaId: string): Promise<void> {
  await db
    .prepare('update sugestoes set promovida_em = ?, musica_id = ? where id = ?')
    .bind(new Date().toISOString(), musicaId, id)
    .run()
}

function comandoDeApoio(db: D1Database, sugestaoId: string, membroId: string): D1PreparedStatement {
  return db
    .prepare('insert into apoios (sugestao_id, membro_id) values (?, ?) on conflict do nothing')
    .bind(sugestaoId, membroId)
}
