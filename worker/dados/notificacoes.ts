import type { Aviso, TipoDeNotificacao } from '../../src/dominio'

export type Notificacao = {
  id: string
  membroId: string
  tipo: TipoDeNotificacao
  titulo: string
  corpo: string
  url: string | null
  escalaId: string | null
  mudancas: number
  enviarApos: string
}

export type NovaNotificacao = {
  membroId: string
  tipo: TipoDeNotificacao
  escalaId: string | null
  aviso: Aviso
  enviarApos: string
  mudancas?: number
}

type LinhaDeNotificacao = {
  id: string
  membro_id: string
  tipo: TipoDeNotificacao
  titulo: string
  corpo: string
  url: string | null
  escala_id: string | null
  mudancas: number
  enviar_apos: string
}

const COLUNAS = 'id, membro_id, tipo, titulo, corpo, url, escala_id, mudancas, enviar_apos'

export async function enfileirar(db: D1Database, nova: NovaNotificacao, agora: Date): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      `insert into notificacoes (id, membro_id, tipo, titulo, corpo, url, escala_id, mudancas, criado_em, enviar_apos)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      nova.membroId,
      nova.tipo,
      nova.aviso.titulo,
      nova.aviso.corpo,
      nova.aviso.url,
      nova.escalaId,
      nova.mudancas ?? 0,
      agora.toISOString(),
      nova.enviarApos,
    )
    .run()

  return id
}

export async function pendenteDe(
  db: D1Database,
  membroId: string,
  tipo: TipoDeNotificacao,
  escalaId: string,
): Promise<Notificacao | null> {
  const linha = await db
    .prepare(
      `select ${COLUNAS} from notificacoes where membro_id = ? and tipo = ? and escala_id = ? and enviada_em is null
       order by enviar_apos limit 1`,
    )
    .bind(membroId, tipo, escalaId)
    .first<LinhaDeNotificacao>()

  return linha ? comoNotificacao(linha) : null
}

export async function jaTeve(
  db: D1Database,
  membroId: string,
  tipo: TipoDeNotificacao,
  escalaId: string,
): Promise<boolean> {
  const linha = await db
    .prepare('select count(*) as n from notificacoes where membro_id = ? and tipo = ? and escala_id = ?')
    .bind(membroId, tipo, escalaId)
    .first<{ n: number }>()

  return (linha?.n ?? 0) > 0
}

export async function ultimoEnvio(
  db: D1Database,
  membroId: string,
  tipo: TipoDeNotificacao,
  escalaId: string,
): Promise<string | null> {
  const linha = await db
    .prepare(
      `select enviada_em from notificacoes where membro_id = ? and tipo = ? and escala_id = ? and enviada_em is not null
       order by enviada_em desc limit 1`,
    )
    .bind(membroId, tipo, escalaId)
    .first<{ enviada_em: string }>()

  return linha?.enviada_em ?? null
}

export async function regravarAviso(db: D1Database, id: string, aviso: Aviso, mudancas: number): Promise<void> {
  await db
    .prepare('update notificacoes set titulo = ?, corpo = ?, url = ?, mudancas = ? where id = ?')
    .bind(aviso.titulo, aviso.corpo, aviso.url, mudancas, id)
    .run()
}

export async function vencidas(db: D1Database, agora: Date, limite = 200): Promise<Notificacao[]> {
  const { results } = await db
    .prepare(
      `select ${COLUNAS} from notificacoes where enviada_em is null and enviar_apos <= ? order by enviar_apos limit ?`,
    )
    .bind(agora.toISOString(), limite)
    .all<LinhaDeNotificacao>()

  return results.map(comoNotificacao)
}

export async function marcarEnviadas(db: D1Database, ids: string[], agora: Date): Promise<void> {
  if (!ids.length) return

  await db
    .prepare(`update notificacoes set enviada_em = ? where id in (${ids.map(() => '?').join(', ')})`)
    .bind(agora.toISOString(), ...ids)
    .run()
}

export async function apagarPendentesDaEscala(db: D1Database, escalaId: string): Promise<void> {
  await db.prepare('delete from notificacoes where escala_id = ? and enviada_em is null').bind(escalaId).run()
}

function comoNotificacao(linha: LinhaDeNotificacao): Notificacao {
  return {
    id: linha.id,
    membroId: linha.membro_id,
    tipo: linha.tipo,
    titulo: linha.titulo,
    corpo: linha.corpo,
    url: linha.url,
    escalaId: linha.escala_id,
    mudancas: linha.mudancas,
    enviarApos: linha.enviar_apos,
  }
}
