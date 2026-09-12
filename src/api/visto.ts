const TOLERANCIA_EM_MS = 60 * 1000

const formatadorDeHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function horaVista(cabecalhoDate: string | null, agora: Date): string | null {
  if (!cabecalhoDate) return null
  const quando = new Date(cabecalhoDate)
  if (Number.isNaN(quando.getTime())) return null
  if (Math.abs(agora.getTime() - quando.getTime()) <= TOLERANCIA_EM_MS) return null
  return formatadorDeHora.format(quando)
}
