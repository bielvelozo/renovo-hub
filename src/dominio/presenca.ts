import { fimDeSemanaDe } from './datas'
import { estadoEscala } from './escala'
import type { Escala, Ministerio } from './tipos'

export const JANELA_DE_FINS_DE_SEMANA = 6

function realizadasComOMembro(m: Ministerio, membroId: string): Escala[] {
  return m.escalas
    .filter((e) => estadoEscala(e, m.hoje) === 'realizada' && e.equipe.some((x) => x.membroId === membroId))
    .sort((a, b) => b.data.localeCompare(a.data))
}

export function escalasNoAno(m: Ministerio, membroId: string, ano = Number(m.hoje.slice(0, 4))): number {
  return realizadasComOMembro(m, membroId).filter((e) => e.data.startsWith(String(ano) + '-')).length
}

export function ultimaEscala(m: Ministerio, membroId: string): Escala | null {
  return realizadasComOMembro(m, membroId)[0] ?? null
}

export function finsDeSemanaSeguidos(m: Ministerio, membroId: string): number {
  let seguidos = 0

  for (const [, escalas] of finsDeSemanaRealizados(m)) {
    if (!esteve(escalas, membroId)) break
    seguidos += 1
  }

  return seguidos
}

export function finsDeSemanaServidos(
  m: Ministerio,
  membroId: string,
  janela = JANELA_DE_FINS_DE_SEMANA,
): { servidos: number; de: number } {
  const ultimos = finsDeSemanaRealizados(m).slice(0, janela)

  return {
    servidos: ultimos.filter(([, escalas]) => esteve(escalas, membroId)).length,
    de: ultimos.length,
  }
}

export function proximaEscalaDoMembro(m: Ministerio, membroId: string): { escala: Escala; funcoes: string[] } | null {
  const agendadas = m.escalas
    .filter((e) => estadoEscala(e, m.hoje) === 'agendada')
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))

  for (const escala of agendadas) {
    const entrada = escala.equipe.find((x) => x.membroId === membroId)
    if (entrada) return { escala, funcoes: entrada.funcoes }
  }

  return null
}

export function presencaDoMembro(m: Ministerio, membroId: string) {
  return {
    escalasNoAno: escalasNoAno(m, membroId),
    ultimaEscala: ultimaEscala(m, membroId)?.data ?? null,
    finsDeSemanaSeguidos: finsDeSemanaSeguidos(m, membroId),
  }
}

function finsDeSemanaRealizados(m: Ministerio): [string, Escala[]][] {
  const porFimDeSemana = new Map<string, Escala[]>()

  for (const escala of m.escalas) {
    if (estadoEscala(escala, m.hoje) !== 'realizada') continue
    const fim = fimDeSemanaDe(escala.data)
    if (!fim) continue
    porFimDeSemana.set(fim, [...(porFimDeSemana.get(fim) ?? []), escala])
  }

  return [...porFimDeSemana.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function esteve(escalas: Escala[], membroId: string): boolean {
  return escalas.some((e) => e.equipe.some((x) => x.membroId === membroId))
}
