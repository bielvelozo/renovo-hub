import { strFromU8, unzipSync } from 'fflate'
import type { Bloco, Letra, Linha } from '../dominio'

export class WordIlegivel extends Error {
  motivo: string

  constructor(motivo: string) {
    super(motivo)
    this.name = 'WordIlegivel'
    this.motivo = motivo
  }
}

type Pedaco = { texto: string; negrito: boolean } | { quebra: true }

type LinhaLida = { texto: string; forte: boolean; marcador: boolean; vazia: boolean }

const DOCUMENTO = 'word/document.xml'

const PARAGRAFO = /<w:p(?:\s[^>]*)?\/>|<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g
const RUN = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g
const REMOVIDO = /<w:del(?:\s[^>]*)?>[\s\S]*?<\/w:del>/g
const PROPRIEDADES = /<w:rPr(?:\s[^>]*)?>([\s\S]*?)<\/w:rPr>/
const NEGRITO = /<w:b(?:\s+([^>]*?))?\/?>/
const COR = /<w:color\s[^>]*w:val="([^"]*)"/
const MIOLO = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br(?:\s[^>]*)?\/?>|<w:tab(?:\s[^>]*)?\/?>/g

export function extrairLetra(bytes: Uint8Array): Letra {
  const xml = lerDocumento(bytes)
  const linhas = xml.replace(REMOVIDO, '').match(PARAGRAFO)?.flatMap(linhasDoParagrafo) ?? []

  const cabecalho = cabecalhoDoTopo(linhas)
  const blocos = blocosDe(linhas.slice(cabecalho.length ? cabecalho.length + 1 : 0))

  if (!blocos.some((bloco) => bloco.tipo === 'estrofe')) {
    throw new WordIlegivel('o documento não tem letra, só marcadores')
  }

  return { cabecalho: cabecalho.map((linha) => semMarcas(linha.texto)), blocos }
}

function lerDocumento(bytes: Uint8Array): string {
  let arquivos: Record<string, Uint8Array>

  try {
    arquivos = unzipSync(bytes, { filter: (arquivo) => arquivo.name === DOCUMENTO })
  } catch {
    throw new WordIlegivel('o arquivo não é um .docx')
  }

  const documento = arquivos[DOCUMENTO]
  if (!documento) throw new WordIlegivel('o .docx não tem word/document.xml')

  return strFromU8(documento)
}

function linhasDoParagrafo(paragrafo: string): LinhaLida[] {
  const runs = [...paragrafo.matchAll(RUN)]
  const colorido = runs.some(([run]) => ehColorido(run))
  const pedacos = runs.flatMap(([run, miolo]) => pedacosDoRun(miolo ?? '', ehNegrito(run)))

  return quebrarEmLinhas(pedacos).map((linha) => classificar(linha, colorido))
}

function pedacosDoRun(miolo: string, negrito: boolean): Pedaco[] {
  return [...miolo.matchAll(MIOLO)].map(([inteiro, texto]) => {
    if (inteiro.startsWith('<w:br')) return { quebra: true } as Pedaco
    if (inteiro.startsWith('<w:tab')) return { texto: ' ', negrito }
    return { texto: desfazerEntidades(texto ?? ''), negrito }
  })
}

function quebrarEmLinhas(pedacos: Pedaco[]): Pedaco[][] {
  const linhas: Pedaco[][] = [[]]

  for (const pedaco of pedacos) {
    if ('quebra' in pedaco) linhas.push([])
    else linhas[linhas.length - 1].push(pedaco)
  }

  return linhas
}

function classificar(pedacos: Pedaco[], colorido: boolean): LinhaLida {
  const texto = pedacos.map((pedaco) => ('quebra' in pedaco ? '' : pedaco.texto)).join('')
  const letras = contarLetras(texto)
  const negritas = pedacos.reduce(
    (total, pedaco) => total + ('quebra' in pedaco || !pedaco.negrito ? 0 : contarLetras(pedaco.texto)),
    0,
  )
  const cru = texto.trim()

  return {
    texto: cru,
    vazia: letras === 0,
    marcador: letras > 0 && (colorido || cru.startsWith('//') || cru.startsWith('*')),
    forte: negritas * 2 > letras,
  }
}

function cabecalhoDoTopo(linhas: LinhaLida[]): LinhaLida[] {
  const vazia = linhas.findIndex((linha) => linha.vazia)
  if (vazia < 1) return []

  const topo = linhas.slice(0, vazia)

  return topo.every((linha) => linha.marcador || linha.forte) ? topo : []
}

function blocosDe(linhas: LinhaLida[]): Bloco[] {
  const blocos: Bloco[] = []
  let estrofe: Linha[] = []

  const fechar = () => {
    if (estrofe.length) blocos.push({ tipo: 'estrofe', linhas: estrofe })
    estrofe = []
  }

  for (const linha of linhas) {
    if (linha.vazia) fechar()
    else if (linha.marcador) {
      fechar()
      blocos.push({ tipo: 'marcador', texto: linha.texto })
    } else estrofe.push({ texto: linha.texto, forte: linha.forte })
  }

  fechar()

  return blocos
}

function ehNegrito(run: string): boolean {
  const propriedades = run.match(PROPRIEDADES)?.[1] ?? ''
  const marca = propriedades.match(NEGRITO)
  if (!marca) return false

  const valor = marca[1]?.match(/w:val="([^"]*)"/)?.[1]

  return valor === undefined || (valor !== '0' && valor !== 'false')
}

function ehColorido(run: string): boolean {
  const valor = (run.match(PROPRIEDADES)?.[1] ?? '').match(COR)?.[1]

  return valor !== undefined && valor !== 'auto' && valor.toUpperCase() !== '000000'
}

function contarLetras(texto: string): number {
  return texto.replace(/\s/g, '').length
}

function semMarcas(texto: string): string {
  return texto.replace(/^[*/\s]+/, '').replace(/[*\s]+$/, '')
}

function desfazerEntidades(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}
