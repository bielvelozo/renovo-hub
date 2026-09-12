import type { EstadoDaSugestao } from '../../src/dominio'

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
  estado: EstadoDaSugestao
  motivo: string
  decididaEm: string | null
  decididaPor: string | null
  escalaId: string | null
  apoios: string[]
}

export type Decisao = {
  decididaPor: string
  motivo?: string
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
  estado: EstadoDaSugestao
  motivo: string
  decidida_em: string | null
  decidida_por: string | null
  escala_id: string | null
}

const COLUNAS =
  'id, membro_id, musica_id, link, titulo, observacao, data, promovida_em, estado, motivo, decidida_em, decidida_por, escala_id'

export async function lerSugestoes(db: D1Database): Promise<Sugestao[]> {
  const { results } = await db
    .prepare(`select ${COLUNAS} from sugestoes order by data desc, rowid desc`)
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
    estado: linha.estado,
    motivo: linha.motivo,
    decididaEm: linha.decidida_em,
    decididaPor: linha.decidida_por,
    escalaId: linha.escala_id,
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

export async function marcarPromovida(
  db: D1Database,
  id: string,
  musicaId: string,
  escalaId: string,
  decidida: Decisao,
): Promise<void> {
  const agora = new Date().toISOString()

  await db
    .prepare(
      "update sugestoes set estado = 'aceita', promovida_em = ?, decidida_em = ?, decidida_por = ?, escala_id = ?, musica_id = ? where id = ?",
    )
    .bind(agora, agora, decidida.decididaPor, escalaId, musicaId, id)
    .run()
}

export async function mudarEstado(
  db: D1Database,
  id: string,
  estado: 'aberta' | 'guardada' | 'recusada',
  decidida: Decisao,
): Promise<void> {
  if (estado === 'aberta') {
    await db
      .prepare("update sugestoes set estado = 'aberta', motivo = '', decidida_em = null, decidida_por = null where id = ?")
      .bind(id)
      .run()
    return
  }

  await db
    .prepare('update sugestoes set estado = ?, motivo = ?, decidida_em = ?, decidida_por = ? where id = ?')
    .bind(estado, decidida.motivo ?? '', new Date().toISOString(), decidida.decididaPor, id)
    .run()
}

function comandoDeApoio(db: D1Database, sugestaoId: string, membroId: string): D1PreparedStatement {
  return db
    .prepare('insert into apoios (sugestao_id, membro_id) values (?, ?) on conflict do nothing')
    .bind(sugestaoId, membroId)
}
