const FUSO = 'America/Sao_Paulo'
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatadorDeHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO,
  hour: '2-digit',
  hour12: false,
})

export function hojeEmBrasilia(agora: Date = new Date()): string {
  return formatador.format(agora)
}

export function horaEmBrasilia(agora: Date = new Date()): number {
  return Number(formatadorDeHora.format(agora))
}

function comoUtc(data: string): Date {
  return new Date(data + 'T12:00:00Z')
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function diaDaSemana(data: string): number {
  return comoUtc(data).getUTCDay()
}

export function nomeDoDia(data: string): string {
  return DIAS[diaDaSemana(data)]
}

export function somarDias(data: string, dias: number): string {
  const d = comoUtc(data)
  d.setUTCDate(d.getUTCDate() + dias)
  return iso(d)
}

export function domingosDoMes(ano: number, mes: number): string[] {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1, 12))
  primeiro.setUTCDate(1 + ((7 - primeiro.getUTCDay()) % 7))
  const out: string[] = []
  while (primeiro.getUTCMonth() === mes - 1) {
    out.push(iso(primeiro))
    primeiro.setUTCDate(primeiro.getUTCDate() + 7)
  }
  return out
}

export function domingoDaSantaCeia(domingos: string[]): string | null {
  return domingos[1] ?? null
}

export function fimDeSemanaDe(data: string): string | null {
  const dia = diaDaSemana(data)
  if (dia === 0) return data
  if (dia === 6) return somarDias(data, 1)
  return null
}

export function formatarDia(data: string): string {
  const [, mes, dia] = data.split('-')
  return dia + '/' + mes
}

export function segundos(minutagem: string | null | undefined): number {
  const partes = String(minutagem ?? '').split(':').map(Number)
  if (partes.length !== 2 || !partes.every(Number.isFinite)) return 0
  return partes[0] * 60 + partes[1]
}

export function ehMinutagem(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{1,2}:\d{2}$/.test(valor)) return false
  return Number(valor.split(':')[1]) < 60
}
