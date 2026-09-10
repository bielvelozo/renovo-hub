export const NOTAS_BRANCAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
export const NOTAS_PRETAS = ['C#', 'Eb', 'F#', 'Ab', 'Bb']

import { segundos } from './datas'
import { musicaPorId } from './escala'
import type { Escala, Ministerio, Musica } from './tipos'

const MAXIMO_DA_PLAYLIST = 50

export function videoIdDoLink(link: string | null | undefined): string | null {
  const texto = String(link ?? '').trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto
  const achado = /(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/.exec(texto)
  return achado ? achado[1] : null
}

export function linkDoVideo(musica: Musica, inicio?: string | null): string {
  const t = inicio ? segundos(inicio) : 0
  return 'https://youtu.be/' + musica.videoId + (t ? '?t=' + t : '')
}

export function capaDaMusica(videoId: string): string {
  return 'https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg'
}

export function capaAlternativa(videoId: string): string {
  return 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'
}

export function videosDaPlaylist(m: Ministerio, escala: Escala): string[] {
  return escala.itens
    .flatMap((item) =>
      item.tipo === 'medley' ? item.trechos.map((trecho) => trecho.musicaId) : [item.musicaId],
    )
    .map((musicaId) => musicaPorId(m, musicaId).videoId)
    .slice(0, MAXIMO_DA_PLAYLIST)
}

export function linkDeVideos(videoIds: string[]): string | null {
  const ids = videoIds.slice(0, MAXIMO_DA_PLAYLIST)
  return ids.length ? 'https://www.youtube.com/watch_videos?video_ids=' + ids.join(',') : null
}

export function linkDaPlaylist(m: Ministerio, escala: Escala): string | null {
  return linkDeVideos(videosDaPlaylist(m, escala))
}

export function buscaNoCifraClub(musica: Pick<Musica, 'titulo'>): string {
  return 'https://www.cifraclub.com.br/?q=' + encodeURIComponent(musica.titulo)
}

export function combinaBusca(musica: Musica, termo: string): boolean {
  const busca = normalizar(termo)
  if (!busca) return true
  return normalizar(musica.titulo + ' ' + musica.artista).includes(busca)
}

export function mesesDesde(data: string, hoje: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  const [anoHoje, mesHoje, diaHoje] = hoje.split('-').map(Number)
  const meses = (anoHoje - ano) * 12 + (mesHoje - mes) - (diaHoje < dia ? 1 : 0)
  return Math.max(0, meses)
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function tomDe(nota: string, menor: boolean): string {
  return nota + (menor ? 'm' : '')
}

export function partesDoTom(tom: string): { nota: string; menor: boolean } {
  const achado = /^([A-G][#b]?)(m?)$/.exec(String(tom ?? '').trim())
  if (!achado) return { nota: '', menor: false }

  return { nota: achado[1], menor: achado[2] === 'm' }
}

export function tituloParaBusca(titulo: string): string {
  const limpo = titulo
    .split(/\||•|\s[-–—]\s/)[0]
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return limpo || titulo.trim()
}

const DIAS_PARA_RECONFERIR = 7

export function precisaReconferir(conferidoEm: string, agora: Date): boolean {
  const quando = Date.parse(conferidoEm)
  if (Number.isNaN(quando)) return true

  return agora.getTime() - quando >= DIAS_PARA_RECONFERIR * 24 * 60 * 60 * 1000
}
