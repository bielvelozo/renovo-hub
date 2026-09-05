export type Conferencia = { grupo: string; nome: string; ok: boolean; detalhe: string }

export function linhaDaConferencia(conferencia: Conferencia): string {
  const marca = (conferencia.ok ? 'ok' : 'FALHOU').padEnd(8)
  const detalhe = conferencia.detalhe ? ` — ${conferencia.detalhe}` : ''

  return `  ${marca}${conferencia.nome}${detalhe}`
}

export function resumoPorGrupo(conferencias: Conferencia[]): { grupo: string; total: number; falhas: number }[] {
  const resumo: { grupo: string; total: number; falhas: number }[] = []

  for (const conferencia of conferencias) {
    const linha = resumo.find((x) => x.grupo === conferencia.grupo) ?? { grupo: conferencia.grupo, total: 0, falhas: 0 }
    if (!resumo.includes(linha)) resumo.push(linha)

    linha.total += 1
    if (!conferencia.ok) linha.falhas += 1
  }

  return resumo
}

export function contarFalhas(conferencias: Conferencia[]): number {
  return conferencias.filter((conferencia) => !conferencia.ok).length
}

export function relatorio(conferencias: Conferencia[]): string {
  if (!conferencias.length) return 'Nenhuma conferência foi feita.'

  const falhas = conferencias.filter((conferencia) => !conferencia.ok)
  const linhas = resumoPorGrupo(conferencias).map(
    ({ grupo, total, falhas: quantas }) => `  ${grupo}: ${total - quantas} de ${total}`,
  )

  if (falhas.length) {
    linhas.push('', 'Falhas:', ...falhas.map(linhaDaConferencia))
  }

  linhas.push('', `${plural(conferencias.length, 'conferência', 'conferências')}, ${vereditoDasFalhas(falhas.length)}.`)

  return linhas.join('\n')
}

function vereditoDasFalhas(quantas: number): string {
  return quantas ? plural(quantas, 'falha', 'falhas') : 'nenhuma falha'
}

function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
