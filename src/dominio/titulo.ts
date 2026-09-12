const CORTES = ['|', '//', '•']
const SEPARADORES = [' - ', ' – ']
const RUIDO = ['ao vivo', 'live', 'clipe oficial', 'official', 'lyric', 'playback', 'video oficial', 'visualizer', 'audio']
const SUFIXOS_DO_CANAL = ['music', 'oficial', 'official']
const PONTAS = /^[\s\-–•|:,.]+|[\s\-–•|:,.]+$/g

export type TituloLimpo = { titulo: string; artista: string }

export function limparTitulo(titulo: string, canal: string): TituloLimpo {
  const cortado = semRuido(antesDoCorte(titulo))
  const partes = dividir(cortado).filter((parte) => aparar(parte) !== '' && !ehSoRuido(parte))
  const nomeDoCanal = semSufixos(canal)

  if (partes.length >= 2) {
    const [primeira, segunda] = partes
    if (coincide(primeira, canal)) return { titulo: aparar(segunda), artista: aparar(primeira) }
    if (coincide(segunda, canal)) return { titulo: aparar(primeira), artista: aparar(segunda) }
    return { titulo: aparar(primeira), artista: aparar(segunda) }
  }

  return { titulo: aparar(partes[0] ?? ''), artista: aparar(nomeDoCanal) }
}

function antesDoCorte(texto: string): string {
  const posicoes = CORTES.map((corte) => texto.indexOf(corte)).filter((posicao) => posicao > 0)
  return posicoes.length ? texto.slice(0, Math.min(...posicoes)) : texto
}

function semRuido(texto: string): string {
  return texto.replace(/\s*[([]([^)\]]*)[)\]]/g, (trecho, conteudo: string) => (temRuido(conteudo) ? '' : trecho))
}

function dividir(texto: string): string[] {
  const separador = SEPARADORES.map((s) => ({ s, i: texto.indexOf(s) }))
    .filter(({ i }) => i > 0)
    .sort((a, b) => a.i - b.i)[0]
  if (!separador) return [texto]
  return [texto.slice(0, separador.i), texto.slice(separador.i + separador.s.length)]
}

function temRuido(texto: string): boolean {
  const normalizado = normalizar(texto)
  return RUIDO.some((ruido) => normalizado.includes(ruido))
}

function ehSoRuido(texto: string): boolean {
  const normalizado = normalizar(texto).replace(/[^a-z0-9 ]/g, '').trim()
  return RUIDO.some((ruido) => normalizado === ruido)
}

function coincide(parte: string, canal: string): boolean {
  const a = normalizar(semSufixos(parte))
  const b = normalizar(semSufixos(canal))
  return a.length > 0 && a === b
}

function semSufixos(nome: string): string {
  let resultado = aparar(nome)
  let mudou = true
  while (mudou) {
    mudou = false
    for (const sufixo of SUFIXOS_DO_CANAL) {
      const normalizado = normalizar(resultado)
      if (normalizado.endsWith(' ' + sufixo)) {
        resultado = aparar(resultado.slice(0, resultado.length - sufixo.length))
        mudou = true
      }
    }
  }
  return resultado
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function aparar(texto: string): string {
  return texto.replace(PONTAS, '').replace(/\s{2,}/g, ' ')
}
