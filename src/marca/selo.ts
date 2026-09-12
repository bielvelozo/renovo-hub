export const LADO = 120
export const CENTRO = 60

export const ANEL_EXTERNO = { raio: 55, traco: 4, tracoPequeno: 6 }
export const ANEL_INTERNO = { raio: 47, traco: 1.5 }

export const LARGURA_DA_BARRA = 8
export const BARRAS = [
  { x: -28, altura: 14 },
  { x: -16, altura: 30 },
  { x: -4, altura: 46 },
  { x: 8, altura: 30 },
  { x: 20, altura: 14 },
] as const

export type CoresDoSelo = { aneis: string; barras: string }

export const CORES_VIVAS: CoresDoSelo = { aneis: 'currentColor', barras: 'var(--acento)' }

export type OpcoesDoSelo = { pequeno?: boolean; cores?: CoresDoSelo }

export function aneisDoSelo({ pequeno = false, cores = CORES_VIVAS }: OpcoesDoSelo = {}): string {
  const traco = pequeno ? ANEL_EXTERNO.tracoPequeno : ANEL_EXTERNO.traco
  const externo = `<circle cx="${CENTRO}" cy="${CENTRO}" r="${ANEL_EXTERNO.raio}" fill="none" stroke="${cores.aneis}" stroke-width="${traco}"/>`
  if (pequeno) return externo
  const interno = `<circle cx="${CENTRO}" cy="${CENTRO}" r="${ANEL_INTERNO.raio}" fill="none" stroke="${cores.aneis}" stroke-width="${ANEL_INTERNO.traco}"/>`
  return `${externo}\n  ${interno}`
}

export function barrasDoSelo({ cores = CORES_VIVAS }: OpcoesDoSelo = {}): string {
  const raio = LARGURA_DA_BARRA / 2
  const retangulos = BARRAS.map(
    ({ x, altura }) => `<rect x="${x}" y="${-altura / 2}" width="${LARGURA_DA_BARRA}" height="${altura}" rx="${raio}"/>`,
  )
  return `<g transform="translate(${CENTRO} ${CENTRO})" fill="${cores.barras}">\n    ${retangulos.join('\n    ')}\n  </g>`
}

export function seloSvg(opcoes: OpcoesDoSelo = {}): string {
  return `<svg viewBox="0 0 ${LADO} ${LADO}" xmlns="http://www.w3.org/2000/svg">\n  ${aneisDoSelo(opcoes)}\n  ${barrasDoSelo(opcoes)}\n</svg>\n`
}
