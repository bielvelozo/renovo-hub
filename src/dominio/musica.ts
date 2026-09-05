import { segundos } from './datas'
import { musicaPorId } from './escala'
import type { Escala, Ministerio, Musica } from './tipos'

const MAXIMO_DA_PLAYLIST = 50

export function videoIdDoLink(link: string | null | undefined): string | null {
  const texto = String(link ?? '').trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto
  const achado = /(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/.exec(texto)
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
    .filter((item) => item.tipo === 'inteira')
    .map((item) => musicaPorId(m, item.musicaId).videoId)
    .slice(0, MAXIMO_DA_PLAYLIST)
}

export function linkDeVideos(videoIds: string[]): string | null {
  const ids = videoIds.slice(0, MAXIMO_DA_PLAYLIST)
  return ids.length ? 'https://www.youtube.com/watch_videos?video_ids=' + ids.join(',') : null
}

export function linkDaPlaylist(m: Ministerio, escala: Escala): string | null {
  return linkDeVideos(videosDaPlaylist(m, escala))
}

export function buscaNoCifraClub(musica: Musica): string {
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
