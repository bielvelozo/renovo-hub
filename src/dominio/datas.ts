const FUSO = 'America/Sao_Paulo'
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const
const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'] as const
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const
const MESES_LONGOS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

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

export function formatarDiaNumerico(data: string): string {
  const [, mes, dia] = data.split('-')
  return dia + '/' + mes
}

export function formatarDia(data: string, hoje = hojeEmBrasilia()): string {
  const [ano, mes, dia] = partesDaData(data)
  return `${DIAS[diaDaSemana(data)]}, ${dia} de ${MESES[mes - 1]}${sufixoDoAno(ano, hoje)}`
}

export function formatarDiaLongo(data: string, hoje = hojeEmBrasilia()): string {
  const [ano, mes, dia] = partesDaData(data)
  return `${DIAS_LONGOS[diaDaSemana(data)]}, ${dia} de ${MESES_LONGOS[mes - 1]}${sufixoDoAno(ano, hoje)}`
}

export function tempoRelativo(data: string, hoje: string): string {
  const dias = Math.round((comoUtc(hoje).getTime() - comoUtc(data).getTime()) / DIA_EM_MS)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 14) return `há ${dias} dias`

  const semanas = Math.floor(dias / 7)
  if (semanas <= 7) return `há ${semanas} semanas`

  const meses = mesesEntre(data, hoje)
  if (meses < 12) return `há ${plural(meses, 'mês', 'meses')}`

  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  if (anos > 1) return `há ${anos} anos`
  return resto ? `há 1 ano e ${plural(resto, 'mês', 'meses')}` : 'há 1 ano'
}

const DIA_EM_MS = 24 * 60 * 60 * 1000

function partesDaData(data: string): [number, number, number] {
  const [ano, mes, dia] = data.split('-').map(Number)
  return [ano, mes, dia]
}

function sufixoDoAno(ano: number, hoje: string): string {
  return ano === partesDaData(hoje)[0] ? '' : ` de ${ano}`
}

function mesesEntre(de: string, ate: string): number {
  const [anoDe, mesDe, diaDe] = partesDaData(de)
  const [anoAte, mesAte, diaAte] = partesDaData(ate)
  return (anoAte - anoDe) * 12 + (mesAte - mesDe) - (diaAte < diaDe ? 1 : 0)
}

function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
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
