import { fimDeSemanaDe } from './datas'
import { estadoEscala } from './escala'
import type { Escala, Ministerio } from './tipos'

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
  const porFimDeSemana = new Map<string, Escala[]>()

  for (const escala of m.escalas) {
    if (estadoEscala(escala, m.hoje) !== 'realizada') continue
    const fim = fimDeSemanaDe(escala.data)
    if (!fim) continue
    porFimDeSemana.set(fim, [...(porFimDeSemana.get(fim) ?? []), escala])
  }

  const decrescentes = [...porFimDeSemana.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  let seguidos = 0

  for (const [, escalas] of decrescentes) {
    const esteve = escalas.some((e) => e.equipe.some((x) => x.membroId === membroId))
    if (!esteve) break
    seguidos += 1
  }

  return seguidos
}

export function presencaDoMembro(m: Ministerio, membroId: string) {
  return {
    escalasNoAno: escalasNoAno(m, membroId),
    ultimaEscala: ultimaEscala(m, membroId)?.data ?? null,
    finsDeSemanaSeguidos: finsDeSemanaSeguidos(m, membroId),
  }
}
