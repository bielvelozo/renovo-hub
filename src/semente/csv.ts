export function lerCsv(texto: string): Record<string, string>[] {
  const linhas = separarLinhas(texto.replace(/^﻿/, ''))
  const cabecalho = linhas.shift()
  if (!cabecalho) return []

  return linhas.map((campos) => {
    const registro: Record<string, string> = {}
    cabecalho.forEach((coluna, i) => {
      registro[coluna] = campos[i] ?? ''
    })
    return registro
  })
}

function separarLinhas(texto: string): string[][] {
  const linhas: string[][] = []
  let campos: string[] = []
  let atual = ''
  let entreAspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]

    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        atual += '"'
        i++
      } else if (c === '"') {
        entreAspas = false
      } else {
        atual += c
      }
      continue
    }

    if (c === '"') entreAspas = true
    else if (c === ',') {
      campos.push(atual)
      atual = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      campos.push(atual)
      if (campos.some((campo) => campo !== '')) linhas.push(campos)
      campos = []
      atual = ''
    } else atual += c
  }

  campos.push(atual)
  if (campos.some((campo) => campo !== '')) linhas.push(campos)

  return linhas
}
