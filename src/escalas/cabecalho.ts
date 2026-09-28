import type { EscalaApresentada } from '../api/tipos'
import { diasEntre, formatarDia, rotuloDoHorario } from '../dominio'

export function subtituloDaEscala(escala: Pick<EscalaApresentada, 'data' | 'horario'>, hoje: string): string {
  const dias = diasEntre(hoje, escala.data)
  const horario = rotuloDoHorario(escala.horario)

  if (dias === 0) return `Hoje, ${horario}`
  if (dias === 1) return `Amanhã, ${horario}`

  return `${formatarDia(escala.data, hoje)} · ${horario}`
}
