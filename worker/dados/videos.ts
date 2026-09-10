import { precisaReconferir } from '../../src/dominio'
import { existeNoYoutube } from './oembed'

type Linha = { video_id: string; existe: number; conferido_em: string }

export type Conferencia = {
  confirmados: string[]
  aReconferir: string[]
}

export async function conferirVideos(db: D1Database, videoIds: string[], agora: Date): Promise<Conferencia> {
  if (!videoIds.length) return { confirmados: [], aReconferir: [] }

  const guardadas = await lerConferidos(db, videoIds)
  const confirmados: string[] = []
  const aReconferir: string[] = []

  for (const videoId of videoIds) {
    const linha = guardadas.get(videoId)

    if (!linha) {
      const existe = await existeNoYoutube(videoId)
      if (existe !== null) await gravarConferido(db, videoId, existe, agora)
      if (existe !== false) confirmados.push(videoId)
      continue
    }

    if (linha.existe === 1) confirmados.push(videoId)
    if (precisaReconferir(linha.conferido_em, agora)) aReconferir.push(videoId)
  }

  return { confirmados, aReconferir }
}

export async function reconferirVideos(db: D1Database, videoIds: string[], agora: Date): Promise<void> {
  for (const videoId of videoIds) {
    const existe = await existeNoYoutube(videoId)
    if (existe !== null) await gravarConferido(db, videoId, existe, agora)
  }
}

async function lerConferidos(db: D1Database, videoIds: string[]): Promise<Map<string, Linha>> {
  const espacos = videoIds.map(() => '?').join(', ')
  const { results } = await db
    .prepare(`select video_id, existe, conferido_em from videos_conferidos where video_id in (${espacos})`)
    .bind(...videoIds)
    .all<Linha>()

  return new Map(results.map((linha) => [linha.video_id, linha]))
}

async function gravarConferido(db: D1Database, videoId: string, existe: boolean, agora: Date): Promise<void> {
  await db
    .prepare(
      `insert into videos_conferidos (video_id, existe, conferido_em) values (?, ?, ?)
       on conflict(video_id) do update set existe = excluded.existe, conferido_em = excluded.conferido_em`,
    )
    .bind(videoId, existe ? 1 : 0, agora.toISOString())
    .run()
}
