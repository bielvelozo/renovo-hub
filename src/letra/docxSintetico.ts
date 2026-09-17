import { strToU8, zipSync } from 'fflate'

export type RunSintetico = {
  texto?: string
  negrito?: boolean
  cor?: string
  tamanho?: number
  quebra?: boolean
  tab?: boolean
  removido?: boolean
}

export type ParagrafoSintetico = string | { runs: RunSintetico[]; centralizado?: boolean }

export function docxDe(paragrafos: ParagrafoSintetico[]): Uint8Array {
  const corpo = paragrafos.map(paragrafo).join('')

  return zipSync({
    'word/document.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo}</w:body></w:document>`,
    ),
  })
}

function paragrafo(paragrafo: ParagrafoSintetico): string {
  if (typeof paragrafo === 'string') {
    return paragrafo ? `<w:p>${run({ texto: paragrafo })}</w:p>` : '<w:p/>'
  }

  const propriedades = paragrafo.centralizado ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : ''

  return `<w:p>${propriedades}${paragrafo.runs.map(run).join('')}</w:p>`
}

function run(run: RunSintetico): string {
  const propriedades = [
    run.negrito ? '<w:b/>' : '',
    run.cor ? `<w:color w:val="${run.cor}"/>` : '',
    run.tamanho ? `<w:sz w:val="${run.tamanho}"/>` : '',
  ].join('')

  const miolo = [
    run.quebra ? '<w:br/>' : '',
    run.tab ? '<w:tab/>' : '',
    run.texto === undefined ? '' : `<w:t xml:space="preserve">${escapar(run.texto)}</w:t>`,
  ].join('')

  const inteiro = `<w:r>${propriedades ? `<w:rPr>${propriedades}</w:rPr>` : ''}${miolo}</w:r>`

  return run.removido ? `<w:del w:id="1" w:author="Alguém">${inteiro}</w:del>` : inteiro
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
