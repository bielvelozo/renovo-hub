const CORTES = /\s*(?:\||\/\/|•)\s*/
const SEPARADORES = /\s[-–]\s/
const RUIDO = ['ao vivo', 'live', 'oficial', 'official', 'lyric', 'playback', 'visualizer', 'audio']
const SUFIXOS_DO_CANAL = ['music', 'oficial', 'official']
const PONTAS = /^[\s\-–•|:,.]+|[\s\-–•|:,.]+$/g

export type TituloLimpo = { titulo: string; artista: string }

export function limparTitulo(titulo: string, canal: string): TituloLimpo {
  const partes = semRuido(pedacoPrincipal(titulo, canal))
    .split(SEPARADORES)
    .filter((parte) => aparar(parte) !== '' && !ehSoRuido(parte))

  if (partes.length >= 2) {
    const doCanal = partes.find((parte) => coincide(parte, canal))
    if (doCanal !== undefined) {
      return { titulo: aparar(partes.find((parte) => parte !== doCanal) ?? ''), artista: semSufixos(doCanal) }
    }
    return { titulo: aparar(partes[0]), artista: semSufixos(partes[1]) }
  }

  return { titulo: aparar(partes[0] ?? ''), artista: semSufixos(canal) }
}

// O YouTube tanto põe o canal depois do corte ("Música | Canal") quanto antes
// ("Canal | Música"): fica o primeiro pedaço que não menciona o canal.
function pedacoPrincipal(texto: string, canal: string): string {
  const pedacos = texto.split(CORTES).filter((pedaco) => aparar(pedaco) !== '')
  const nomeDoCanal = normalizar(semSufixos(canal))
  const semCanal = nomeDoCanal ? pedacos.filter((pedaco) => !normalizar(pedaco).includes(nomeDoCanal)) : pedacos

  return semCanal[0] ?? pedacos[0] ?? texto
}

function semRuido(texto: string): string {
  return texto.replace(/\s*[([]([^)\]]*)[)\]]/g, (trecho, conteudo: string) => (temRuido(conteudo) ? '' : trecho))
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
