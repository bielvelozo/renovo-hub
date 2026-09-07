import type { MusicaNaLista, TomSugeridoApresentado } from '../api/tipos'
import type { OrdemDoCatalogo } from '../dominio'
import { formatarDia } from '../dominio'

export type FiltroDoCatalogo = 'todas' | 'nova' | 'legado' | 'uma-vez' | 'meses-3' | 'meses-6' | 'meses-12'

export const FILTROS: { valor: FiltroDoCatalogo; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'nova', rotulo: 'Novas' },
  { valor: 'legado', rotulo: 'Legado' },
  { valor: 'uma-vez', rotulo: 'Tocadas uma vez' },
  { valor: 'meses-3', rotulo: '+ de 3 meses' },
  { valor: 'meses-6', rotulo: '+ de 6 meses' },
  { valor: 'meses-12', rotulo: '+ de 12 meses' },
]

export const ORDENS: { valor: OrdemDoCatalogo; rotulo: string }[] = [
  { valor: 'mais-tempo', rotulo: 'Faz mais tempo' },
  { valor: 'menos-tempo', rotulo: 'Faz menos tempo' },
]

export function caminhoDoCatalogo(filtro: FiltroDoCatalogo, ordem: OrdemDoCatalogo): string {
  const partes: string[] = []

  if (filtro === 'nova' || filtro === 'legado' || filtro === 'uma-vez') partes.push(`filtro=${filtro}`)
  else if (filtro !== 'todas') partes.push(`meses=${mesesDoFiltro(filtro)}`)

  if (ordem === 'menos-tempo') partes.push('ordem=menos-tempo')

  return '/api/musicas' + (partes.length ? '?' + partes.join('&') : '')
}

export function textoDoVazio(filtro: FiltroDoCatalogo, busca: string): string {
  if (busca.trim()) return 'Nenhuma Música com esse texto.'

  if (filtro === 'nova') return 'Nenhuma Música Nova: todas já foram tocadas ou vieram da playlist.'
  if (filtro === 'legado') return 'Nenhuma Música de Legado: todas já foram tocadas no app.'
  if (filtro === 'uma-vez') return 'Nenhuma Música tocada uma vez só.'
  if (filtro === 'todas') return 'Nenhuma Música no catálogo ainda.'

  return `Nenhuma Música parada há mais de ${mesesDoFiltro(filtro)} meses.`
}

function mesesDoFiltro(filtro: FiltroDoCatalogo): string {
  return filtro.replace('meses-', '')
}

export function textoDoUltimoTom(sugerido: TomSugeridoApresentado | null): string {
  if (!sugerido) return 'Sem Tom conhecido: ninguém tocou e ninguém preencheu à mão.'

  if (sugerido.origem === 'execucao') {
    const quem = sugerido.ministradoPorNome ? ' com ' + sugerido.ministradoPorNome : ''
    const parcial = sugerido.parcial ? ' (trecho)' : ''
    return `Último Tom: ${sugerido.tom}, tocado em ${formatarDia(sugerido.data ?? '')}${quem}${parcial}.`
  }

  if (sugerido.origem === 'conhecido') return `Último tom conhecido: ${sugerido.tom}, preenchido à mão.`

  return `Tom original da gravação: ${sugerido.tom}.`
}

export type SeloDaMusica = { chave: string; texto: string }

export function selosDaMusica(musica: MusicaNaLista): SeloDaMusica[] {
  const selos: SeloDaMusica[] = []
  const ultima = musica.ultimaExecucao

  if (ultima) {
    selos.push({ chave: 'tom', texto: `Tom ${ultima.tom}` })
    selos.push({
      chave: 'quando',
      texto: formatarDia(ultima.data) + (ultima.ministradoPorNome ? ` · ${ultima.ministradoPorNome}` : ''),
    })
    if (ultima.parcial) selos.push({ chave: 'parcial', texto: 'trecho' })
  } else {
    if (musica.tomConhecido) selos.push({ chave: 'tom', texto: `Tom ${musica.tomConhecido}` })
    else if (musica.tomOriginal) selos.push({ chave: 'tom', texto: `Tom ${musica.tomOriginal} · original` })

    selos.push({ chave: 'nunca', texto: 'nunca tocada' })
  }

  if (musica.legado) selos.push({ chave: 'legado', texto: 'Legado' })
  else if (musica.nova) selos.push({ chave: 'nova', texto: 'Nova' })

  return selos
}
