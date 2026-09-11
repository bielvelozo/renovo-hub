import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import opentype from 'opentype.js'
import type { Font, Glyph, Path } from 'opentype.js'
import { CENTRO, CORES_VIVAS, LADO, aneisDoSelo, barrasDoSelo, seloSvg } from '../src/marca/selo'
import type { CoresDoSelo } from '../src/marca/selo'

const FRAUNCES = 'docs/brand/fontes/Fraunces144ptSoft-Bold.ttf'
const INTER = 'docs/brand/fontes/Inter-Bold.ttf'

const ARCO = {
  raio: 36,
  cima: { texto: 'RENOVO', tamanho: 12.5, espacamento: 2.2 },
  baixo: { texto: 'MUSIC', tamanho: 8.5, espacamento: 3.4 },
}
const PONTOS = { raio: 38, tamanho: 1.8 }

const HORIZONTAL = { altura: 64, vao: 14, palavra: 40, sub: 18, espacamentoDoSub: 0.3 }
const ABERTURA = { largura: 1170, altura: 2532, selo: 420, palavra: 96, sub: 43, vao: 56 }

const ALTURA_DAS_MAIUSCULAS = { fraunces: 0.7, inter: 0.73 }

export const CORES_FIXAS: CoresDoSelo = { aneis: '#F3E9E1', barras: '#9FB8E6' }
export const FUNDO_ESCURO = '#1F1B22'

export type Fontes = { fraunces: Font; inter: Font }

type Matriz = { a: number; b: number; c: number; d: number; e: number; f: number }
type GlifoPosto = { glifo: Glyph; centro: number; largura: number }
type Texto = { glifos: GlifoPosto[]; comprimento: number }

export async function carregarFontes(): Promise<Fontes> {
  const [fraunces, inter] = await Promise.all([FRAUNCES, INTER].map(carregar))
  return { fraunces, inter }
}

async function carregar(arquivo: string): Promise<Font> {
  const bytes = await readFile(arquivo)
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
}

function medir(fonte: Font, texto: string, tamanho: number, espacamento = 0): Texto {
  const escala = tamanho / fonte.unitsPerEm
  const glifos = Array.from(texto, (letra) => fonte.charToGlyph(letra))
  const postos: GlifoPosto[] = []
  let cursor = 0

  glifos.forEach((glifo, i) => {
    const largura = (glifo.advanceWidth ?? 0) * escala
    const anterior = glifos[i - 1]
    if (anterior) cursor += fonte.getKerningValue(anterior, glifo) * escala + espacamento
    postos.push({ glifo, centro: cursor + largura / 2, largura })
    cursor += largura
  })

  return { glifos: postos, comprimento: cursor }
}

function caminho(glifo: Glyph, tamanho: number, m: Matriz): string {
  const trilha: Path = glifo.getPath(0, 0, tamanho)
  const ponto = (x: number, y: number) => `${arredondar(m.a * x + m.c * y + m.e)} ${arredondar(m.b * x + m.d * y + m.f)}`

  return trilha.commands
    .map((c) => {
      switch (c.type) {
        case 'M':
          return `M${ponto(c.x, c.y)}`
        case 'L':
          return `L${ponto(c.x, c.y)}`
        case 'Q':
          return `Q${ponto(c.x1, c.y1)} ${ponto(c.x, c.y)}`
        case 'C':
          return `C${ponto(c.x1, c.y1)} ${ponto(c.x2, c.y2)} ${ponto(c.x, c.y)}`
        case 'Z':
          return 'Z'
      }
    })
    .join('')
}

function rotacao(angulo: number, dx: number, dy: number): Matriz {
  return { a: Math.cos(angulo), b: Math.sin(angulo), c: -Math.sin(angulo), d: Math.cos(angulo), e: dx, f: dy }
}

function textoEmArco(fonte: Font, texto: string, tamanho: number, espacamento: number, lado: 'cima' | 'baixo'): string {
  const { glifos, comprimento } = medir(fonte, texto, tamanho, espacamento)
  const r = ARCO.raio

  return glifos
    .map(({ glifo, centro, largura }) => {
      const desvio = (centro - comprimento / 2) / r
      const angulo = lado === 'cima' ? -Math.PI / 2 + desvio : Math.PI / 2 - desvio
      const giro = lado === 'cima' ? angulo + Math.PI / 2 : angulo - Math.PI / 2
      const x = CENTRO + r * Math.cos(angulo)
      const y = CENTRO + r * Math.sin(angulo)
      const meia = largura / 2
      return caminho(glifo, tamanho, rotacao(giro, x - meia * Math.cos(giro), y - meia * Math.sin(giro)))
    })
    .join('')
}

function textoEmLinha(fonte: Font, texto: string, tamanho: number, x: number, y: number, espacamento = 0): string {
  const { glifos } = medir(fonte, texto, tamanho, espacamento)
  return glifos.map(({ glifo, centro, largura }) => caminho(glifo, tamanho, rotacao(0, x + centro - largura / 2, y))).join('')
}

function corpoDoSeloCompleto(fontes: Fontes, cores: CoresDoSelo): string {
  const cima = textoEmArco(fontes.fraunces, ARCO.cima.texto, ARCO.cima.tamanho, ARCO.cima.espacamento, 'cima')
  const baixo = textoEmArco(fontes.inter, ARCO.baixo.texto, ARCO.baixo.tamanho, ARCO.baixo.espacamento, 'baixo')
  const pontos = [CENTRO - PONTOS.raio, CENTRO + PONTOS.raio]
    .map((x) => `<circle cx="${x}" cy="${CENTRO}" r="${PONTOS.tamanho}"/>`)
    .join('')

  return `${aneisDoSelo({ cores })}\n  <g fill="${cores.aneis}"><path d="${cima}"/><path d="${baixo}"/>${pontos}</g>\n  ${barrasDoSelo({ cores })}`
}

export function desenharSeloCompleto(fontes: Fontes, cores = CORES_VIVAS): string {
  return `<svg viewBox="0 0 ${LADO} ${LADO}" xmlns="http://www.w3.org/2000/svg">\n  ${corpoDoSeloCompleto(fontes, cores)}\n</svg>\n`
}

export function desenharMarcaHorizontal(fontes: Fontes, cores = CORES_VIVAS): string {
  const { altura, vao, palavra, sub, espacamentoDoSub } = HORIZONTAL
  const inicio = altura + vao
  const larguraDoRenovo = medir(fontes.fraunces, 'Renovo', palavra).comprimento
  const larguraDoMusic = medir(fontes.inter, 'MUSIC', sub, sub * espacamentoDoSub).comprimento
  const largura = Math.ceil(inicio + Math.max(larguraDoRenovo, larguraDoMusic)) + 2
  const renovo = textoEmLinha(fontes.fraunces, 'Renovo', palavra, inicio, 40)
  const music = textoEmLinha(fontes.inter, 'MUSIC', sub, inicio, 61, sub * espacamentoDoSub)

  return `<svg viewBox="0 0 ${largura} ${altura}" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(${arredondar(altura / LADO)})">
  ${corpoDoSeloCompleto(fontes, cores)}
  </g>
  <g fill="${cores.aneis}"><path d="${renovo}"/><path d="${music}"/></g>
</svg>
`
}

export function desenharAbertura(fontes: Fontes): string {
  const { largura, altura, selo, palavra, sub, vao } = ABERTURA
  const espacamentoDoSub = sub * 0.3
  const larguraDoRenovo = medir(fontes.fraunces, 'Renovo', palavra).comprimento
  const larguraDoMusic = medir(fontes.inter, 'MUSIC', sub, espacamentoDoSub).comprimento
  const alturaDoRenovo = palavra * ALTURA_DAS_MAIUSCULAS.fraunces
  const alturaDoMusic = sub * ALTURA_DAS_MAIUSCULAS.inter
  const alturaDoBloco = selo + vao + alturaDoRenovo + 24 + alturaDoMusic
  const topo = (altura - alturaDoBloco) / 2
  const linhaDoRenovo = topo + selo + vao + alturaDoRenovo
  const linhaDoMusic = linhaDoRenovo + 24 + alturaDoMusic

  return `<svg viewBox="0 0 ${largura} ${altura}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${largura}" height="${altura}" fill="${FUNDO_ESCURO}"/>
  <g transform="translate(${(largura - selo) / 2} ${arredondar(topo)}) scale(${arredondar(selo / LADO)})">
  ${corpoDoSeloCompleto(fontes, CORES_FIXAS)}
  </g>
  <g fill="${CORES_FIXAS.aneis}">
    <path d="${textoEmLinha(fontes.fraunces, 'Renovo', palavra, (largura - larguraDoRenovo) / 2, linhaDoRenovo)}"/>
    <path d="${textoEmLinha(fontes.inter, 'MUSIC', sub, (largura - larguraDoMusic) / 2, linhaDoMusic, espacamentoDoSub)}"/>
  </g>
</svg>
`
}

function arredondar(n: number): number {
  return Math.round(n * 100) / 100
}

async function main(): Promise<void> {
  const fontes = await carregarFontes()
  await escrever('public/selo.svg', seloSvg())
  await escrever('public/selo-completo.svg', desenharSeloCompleto(fontes))
  await escrever('public/marca-horizontal.svg', desenharMarcaHorizontal(fontes))
}

async function escrever(arquivo: string, conteudo: string): Promise<void> {
  await writeFile(arquivo, conteudo)
  console.log(`${arquivo} — ${(conteudo.length / 1024).toFixed(1)} KB`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
