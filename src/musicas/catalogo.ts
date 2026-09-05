import type { TomSugeridoApresentado } from '../api/tipos'
import { formatarDia } from '../dominio'

export type FiltroDoCatalogo = 'todas' | 'nova' | 'legado' | 'meses-3' | 'meses-6' | 'meses-12'

export const FILTROS: { valor: FiltroDoCatalogo; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'nova', rotulo: 'Novas' },
  { valor: 'legado', rotulo: 'Legado' },
  { valor: 'meses-3', rotulo: '+ de 3 meses' },
  { valor: 'meses-6', rotulo: '+ de 6 meses' },
  { valor: 'meses-12', rotulo: '+ de 12 meses' },
]

export function caminhoDoCatalogo(filtro: FiltroDoCatalogo): string {
  if (filtro === 'todas') return '/api/musicas'
  if (filtro === 'nova' || filtro === 'legado') return `/api/musicas?filtro=${filtro}`

  return `/api/musicas?meses=${mesesDoFiltro(filtro)}`
}

export function textoDoVazio(filtro: FiltroDoCatalogo, busca: string): string {
  if (busca.trim()) return 'Nenhuma Música com esse texto.'

  if (filtro === 'nova') return 'Nenhuma Música Nova: todas já foram tocadas ou vieram da playlist.'
  if (filtro === 'legado') return 'Nenhuma Música de Legado: todas já foram tocadas no app.'
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
