// O Tom de um Item pode ser esta palavra em vez de uma nota: "toca no tom da gravação",
// enquanto ninguém tirou a música. Vale como Tom pra tudo — texto do WhatsApp, histórico,
// notificação — e vira nota quando um músico descobrir qual é.
export const TOM_ORIGINAL = 'original'

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

export function combinaBusca(musica: Pick<Musica, 'titulo' | 'artista'>, termo: string): boolean {
  const busca = normalizarTexto(termo)
  if (!busca) return true
  return normalizarTexto(musica.titulo + ' ' + musica.artista).includes(busca)
}

export function mesesDesde(data: string, hoje: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  const [anoHoje, mesHoje, diaHoje] = hoje.split('-').map(Number)
  const meses = (anoHoje - ano) * 12 + (mesHoje - mes) - (diaHoje < dia ? 1 : 0)
  return Math.max(0, meses)
}

export function normalizarTexto(texto: string): string {
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

// O YouTube escreve tanto "Música - Artista" quanto "Artista - Música", e nenhum dos
// dois lados é confiável: os dois viram candidatos e quem decide é `achadoCombina`.
export function pedacosDoTitulo(titulo: string): string[] {
  const pedacos = titulo
    .split(/\||•|\s[-–—]\s/)
    .map((pedaco) =>
      pedaco
        .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)

  return pedacos.length ? pedacos : [titulo.trim()]
}

// A busca do Cifra Club é frouxa: devolve qualquer música do artista ou com uma palavra
// em comum. Só vale o achado cujo nome esteja no título e cubra algum pedaço dele.
export function achadoCombina(nomeAchado: string, tituloOriginal: string): boolean {
  return (
    nomeEstaEm(nomeAchado, tituloOriginal, 0.7) &&
    pedacosDoTitulo(tituloOriginal).some((pedaco) => nomeEstaEm(pedaco, nomeAchado, 0.6))
  )
}

export function nomeEstaEm(nome: string, texto: string, minimo = 0.7): boolean {
  const palavras = palavrasDoNome(nome)
  if (!palavras.length) return false

  const alvo = new Set(palavrasDe(texto))

  return palavras.filter((palavra) => alvo.has(palavra)).length / palavras.length >= minimo
}

function palavrasDoNome(nome: string): string[] {
  const todas = palavrasDe(nome.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '))
  const longas = todas.filter((palavra) => palavra.length > 2)

  return longas.length ? longas : todas
}

function palavrasDe(texto: string): string[] {
  return normalizarTexto(texto).split(/[^a-z0-9]+/).filter(Boolean)
}

const DIAS_PARA_RECONFERIR = 7

export function precisaReconferir(conferidoEm: string, agora: Date): boolean {
  const quando = Date.parse(conferidoEm)
  if (Number.isNaN(quando)) return true

  return agora.getTime() - quando >= DIAS_PARA_RECONFERIR * 24 * 60 * 60 * 1000
}
