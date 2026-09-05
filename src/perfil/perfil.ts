import type { EscalaResumida } from '../api/tipos'
import { textoDeFinsDeSemana } from '../dominio'
import { rotuloDoDia } from '../escalas/mes'

export function textoDasEscalasNoAno(quantidade: number): string {
  if (quantidade === 0) return 'nenhuma ainda'

  return quantidade === 1 ? '1 Escala' : `${quantidade} Escalas`
}

export function textoDaUltimaEscala(ultima: EscalaResumida | null): string {
  if (!ultima) return 'nenhuma ainda'

  return `${ultima.titulo} · ${rotuloDoDia(ultima.data)}`
}

export function textoDeSeguidos(quantidade: number): string {
  return textoDeFinsDeSemana(quantidade) ?? 'nenhum ainda'
}
