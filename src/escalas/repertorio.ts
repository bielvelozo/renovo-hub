import type { ItemApresentado, MusicaResumida } from '../api/tipos'

const MAXIMO_DE_CAPAS = 4

export function tituloDoItem(item: ItemApresentado): string {
  return item.tipo === 'medley' ? 'Medley' : item.musica.titulo
}

export function resumoDoItem(item: ItemApresentado): string {
  if (item.tipo === 'medley') {
    return item.trechos
      .map((trecho) => `${trecho.musica.titulo} ${trecho.inicio}–${trecho.fim} · Tom ${trecho.tom}`)
      .join(' + ')
  }

  const minutagem = item.tipo === 'trecho' ? `${item.inicio}–${item.fim} · ` : ''

  return minutagem + 'Tom ' + item.tom
}

export function capasDoItem(item: ItemApresentado): MusicaResumida[] {
  if (item.tipo === 'medley') return item.trechos.slice(0, MAXIMO_DE_CAPAS).map((trecho) => trecho.musica)
  return [item.musica]
}

export function videosDoRepertorio(itens: ItemApresentado[]): string[] {
  return itens.flatMap((item) =>
    item.tipo === 'medley' ? item.trechos.map((trecho) => trecho.musica.videoId) : [item.musica.videoId],
  )
}
