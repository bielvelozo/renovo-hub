const CORTES = /\s*(?:\||\/\/|•)\s*/
const SEPARADORES = /\s[-–]\s/
const RUIDO = [
  'ao vivo',
  'live',
  'oficial',
  'official',
  'lyric',
  'playback',
  'visualizer',
  'audio',
  'clipe',
  'clip',
  'legendado',
  'letra',
  'dvd',
  'ep',
  'ministracao',
]
const MARCAS_DE_ARTISTA = [/\bconvida\b/i, /(?:^|\s)@\w/, /^ministério\s/i]
const SUFIXOS_DO_CANAL = ['music', 'oficial', 'official']
const PONTAS = /^[\s\-–•|:,.]+|[\s\-–•|:,.]+$/g
const TAMANHO_MINIMO_DO_CANAL = 4

export type TituloLimpo = { titulo: string; artista: string }

export function limparTitulo(titulo: string, canal: string): TituloLimpo {
  const limpo = separar(titulo, canal)
  if (limpo.titulo) return limpo

  const cru = aparar(semRuido(titulo))
  return { titulo: cru || semSufixos(canal) || aparar(titulo), artista: limpo.artista || semSufixos(canal) }
}

function separar(titulo: string, canal: string): TituloLimpo {
  const todas = semRuido(pedacoPrincipal(titulo, canal))
    .split(SEPARADORES)
    .filter((parte) => aparar(parte) !== '' && !ehSoRuido(parte))
  const partes = todas.length >= 3 ? todas.filter((parte) => !temRuido(parte)) : todas

  if (partes.length >= 2) {
    const doCanal = partes.find((parte) => coincide(parte, canal)) ?? partes.find((parte) => pareceDoCanal(parte, canal))
    if (doCanal !== undefined) {
      return { titulo: aparar(partes.find((parte) => parte !== doCanal) ?? ''), artista: semSufixos(doCanal) }
    }

    const marcada = partes.find((parte) => MARCAS_DE_ARTISTA.some((marca) => marca.test(aparar(parte))))
    if (marcada !== undefined) {
      return { titulo: aparar(partes.find((parte) => parte !== marcada) ?? ''), artista: semSufixos(marcada) }
    }

    return { titulo: aparar(partes[0]), artista: semSufixos(partes[1]) }
  }

  return { titulo: aparar(partes[0] ?? ''), artista: semSufixos(canal) }
}

function pedacoPrincipal(texto: string, canal: string): string {
  const pedacos = texto.split(CORTES).filter((pedaco) => aparar(pedaco) !== '' && !ehSoRuido(pedaco))
  const nomeDoCanal = normalizar(semSufixos(canal))
  const semCanal = nomeDoCanal
    ? pedacos.filter((pedaco) => SEPARADORES.test(pedaco) || !normalizar(pedaco).includes(nomeDoCanal))
    : pedacos

  return semCanal[0] ?? pedacos[0] ?? texto
}

function semRuido(texto: string): string {
  return texto
    .replace(/\s*[([]([^)\]]*)[)\]]/g, (trecho, conteudo: string) => (temRuido(conteudo) ? '' : trecho))
    .replace(/\s*[([][^)\]]*$/, '')
}

function temRuido(texto: string): boolean {
  const normalizado = normalizar(texto)
  return RUIDO.some((ruido) => new RegExp(`(?:^|[^a-z0-9])${ruido}(?:$|[^a-z0-9])`).test(normalizado))
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

function pareceDoCanal(parte: string, canal: string): boolean {
  const a = normalizar(semSufixos(parte))
  const b = normalizar(semSufixos(canal))
  if (a.length < TAMANHO_MINIMO_DO_CANAL || b.length < TAMANHO_MINIMO_DO_CANAL) return false
  return a.includes(b) || b.includes(a)
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
