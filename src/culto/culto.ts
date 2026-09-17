import type { EscalaDoCulto, ItemDoCulto, MusicaDoCulto, TomDoCulto } from '../api/tipos'
import type { Letra } from '../dominio'
import {
  TOM_ORIGINAL,
  combinaBusca,
  formatarDia,
  formatarDiaNumerico,
  hojeEmBrasilia,
  horaEmBrasilia,
  nomeDoDia,
  normalizarTexto,
  rotuloDoHorario,
} from '../dominio'
import { juntarLetras } from '../letra/letra'

export const MAIS_TOCADAS = 8

const MAXIMO_DA_PESQUISA = 50

export function posicaoDoItem(itens: ItemDoCulto[], itemId: string): number {
  return itens.findIndex((item) => item.id === itemId) + 1
}

export function itemAnterior(itens: ItemDoCulto[], itemId: string): ItemDoCulto | null {
  return vizinho(itens, itemId, -1)
}

export function itemSeguinte(itens: ItemDoCulto[], itemId: string): ItemDoCulto | null {
  return vizinho(itens, itemId, 1)
}

export function musicaDoCatalogo(catalogo: MusicaDoCulto[], musicaId: string): MusicaDoCulto | null {
  return catalogo.find((musica) => musica.id === musicaId) ?? null
}

export function tituloDoItem(item: ItemDoCulto): string {
  if (item.tipo !== 'medley') return item.titulo
  return 'Medley: ' + item.trechos.map((trecho) => trecho.titulo).join(' + ')
}

export function dicaDoItem(item: ItemDoCulto, catalogo: MusicaDoCulto[]): string {
  const letra = temLetra(item, catalogo) ? ' · letra' : ''
  if (item.tipo !== 'medley') return item.artista + letra

  const trechos = item.trechos.length === 1 ? '1 trecho' : `${item.trechos.length} trechos`
  return trechos + letra
}

export function temLetra(item: ItemDoCulto, catalogo: MusicaDoCulto[]): boolean {
  if (item.tipo !== 'medley') return !!musicaDoCatalogo(catalogo, item.musicaId)?.letra
  if (item.letra) return true
  return item.trechos.some((trecho) => musicaDoCatalogo(catalogo, trecho.musicaId)?.letra)
}

export function tonsDoMedley(item: ItemDoCulto): string {
  if (item.tipo !== 'medley') return item.tom
  return item.trechos.map((trecho) => (trecho.tom === TOM_ORIGINAL ? 'orig.' : trecho.tom)).join(' · ')
}

export function letrasDoMedley(item: ItemDoCulto, catalogo: MusicaDoCulto[]): Letra | null {
  if (item.tipo !== 'medley') return musicaDoCatalogo(catalogo, item.musicaId)?.letra ?? null
  if (item.letra) return item.letra

  return juntarLetras(
    item.trechos.map((trecho) => ({
      titulo: trecho.titulo,
      letra: musicaDoCatalogo(catalogo, trecho.musicaId)?.letra ?? null,
    })),
  )
}

export function maisTocadas(catalogo: MusicaDoCulto[], quantas = MAIS_TOCADAS): MusicaDoCulto[] {
  return [...catalogo]
    .sort((a, b) => b.vezesTocada - a.vezesTocada || porTitulo(a, b))
    .slice(0, quantas)
}

export function buscarNoCatalogo(catalogo: MusicaDoCulto[], termo: string): MusicaDoCulto[] {
  return catalogo
    .filter((musica) => combinaBusca(musica, termo))
    .sort(porTitulo)
    .slice(0, MAXIMO_DA_PESQUISA)
}

export function tituloDoCulto(escala: Pick<EscalaDoCulto, 'titulo' | 'horario'>): string {
  const hora = rotuloDoHorario(escala.horario)
  if (!escala.titulo.endsWith(' ' + hora)) return escala.titulo

  return escala.titulo.slice(0, -hora.length - 1) + ' · ' + hora
}

export function tituloDaOrdem(escala: Pick<EscalaDoCulto, 'data'>, hoje: string): string {
  return 'Ordem de ' + (escala.data === hoje ? 'hoje' : formatarDia(escala.data, hoje))
}

export function quandoAtualizado(geradoEm: string): string {
  const momento = new Date(geradoEm)
  return `${nomeDoDia(hojeEmBrasilia(momento))}, ${horaEmBrasilia(momento)}h`
}

export function ultimoTomTocado(tom: TomDoCulto | null): string | null {
  if (!tom || tom.origem !== 'execucao' || !tom.data) return null

  const quem = tom.ministradoPorNome ? tom.ministradoPorNome + ', ' : ''
  return `último: ${tom.valor} · ${quem}${formatarDiaNumerico(tom.data)}`
}

function vizinho(itens: ItemDoCulto[], itemId: string, passo: number): ItemDoCulto | null {
  const onde = itens.findIndex((item) => item.id === itemId)
  if (onde < 0) return null

  return itens[onde + passo] ?? null
}

function porTitulo(a: MusicaDoCulto, b: MusicaDoCulto): number {
  return normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo))
}
