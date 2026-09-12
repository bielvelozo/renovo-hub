import type { EscalaResumida } from '../api/tipos'
import { formatarDia, hojeEmBrasilia } from '../dominio'

export function rotuloDeEscalasNoAno(quantidade: number): string {
  return quantidade === 1 ? 'Escala no ano' : 'Escalas no ano'
}

export function rotuloDeSeguidos(quantidade: number): string {
  return quantidade === 1 ? 'fim de semana seguido' : 'fins de semana seguidos'
}

export function textoDaUltimaEscala(ultima: EscalaResumida | null, hoje = hojeEmBrasilia()): string {
  if (!ultima) return 'nenhuma ainda'

  return `${ultima.titulo} · ${formatarDia(ultima.data, hoje)}`
}
