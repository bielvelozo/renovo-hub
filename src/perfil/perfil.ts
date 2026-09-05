import type { EscalaResumida } from '../api/tipos'
import { rotuloDoDia } from '../escalas/mes'

export function rotuloDeEscalasNoAno(quantidade: number): string {
  return quantidade === 1 ? 'Escala no ano' : 'Escalas no ano'
}

export function rotuloDeSeguidos(quantidade: number): string {
  return quantidade === 1 ? 'fim de semana seguido' : 'fins de semana seguidos'
}

export function textoDaUltimaEscala(ultima: EscalaResumida | null): string {
  if (!ultima) return 'nenhuma ainda'

  return `${ultima.titulo} · ${rotuloDoDia(ultima.data)}`
}
