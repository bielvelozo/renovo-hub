import type { MusicaNaLista, TomSugeridoApresentado } from '../api/tipos'
import { formatarDia, hojeEmBrasilia, normalizarTexto } from '../dominio'

export function textoDoUltimoTom(sugerido: TomSugeridoApresentado | null, hoje = hojeEmBrasilia()): string {
  if (!sugerido) return 'Sem tom definido.'

  if (sugerido.origem === 'execucao') {
    const quem = sugerido.ministradoPorNome ? ' com ' + sugerido.ministradoPorNome : ''
    const parcial = sugerido.parcial ? ' (trecho)' : ''
    return `Último tom: ${sugerido.tom}, tocado em ${formatarDia(sugerido.data ?? '', hoje)}${quem}${parcial}.`
  }

  if (sugerido.origem === 'conhecido') return `Tom: ${sugerido.tom}.`

  return `Tom original da gravação: ${sugerido.tom}.`
}

export type AbaDoCatalogo = 'redescobrir' | 'recentes' | 'todas'

export const ABAS_DO_CATALOGO: { valor: AbaDoCatalogo; rotulo: string; explicacao?: string }[] = [
  {
    valor: 'redescobrir',
    rotulo: 'Redescobrir',
    explicacao: 'Nunca tocadas ou paradas há 3 meses ou mais.',
  },
  {
    valor: 'recentes',
    rotulo: 'Recentes',
    explicacao: 'Tocadas nos últimos 3 meses.',
  },
  { valor: 'todas', rotulo: 'Todas' },
]

export type Ver = 'todas' | 'minhas' | 'outros' | 'com-letra' | 'sugestoes'

export const VISOES: { valor: Ver; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'minhas', rotulo: 'Escolhidas por mim' },
  { valor: 'outros', rotulo: 'Escolhidas por outros' },
  { valor: 'com-letra', rotulo: 'Com letra' },
]

export function aplicarVer(musicas: MusicaNaLista[], ver: Ver, euId: string): MusicaNaLista[] {
  if (ver === 'minhas') return musicas.filter((musica) => musica.ultimaExecucao?.ministradoPor === euId)
  if (ver === 'outros') {
    return musicas.filter((musica) => !!musica.ultimaExecucao?.ministradoPor && musica.ultimaExecucao.ministradoPor !== euId)
  }
  if (ver === 'com-letra') return musicas.filter((musica) => musica.temLetra)
  return musicas
}

export type SecaoDoCatalogo = {
  chave: string
  titulo: string
  musicas: MusicaNaLista[]
  atencao: boolean
}

export function contagemPorAba(musicas: MusicaNaLista[]): Record<AbaDoCatalogo, number> {
  return {
    redescobrir: musicas.filter((musica) => musica.aba === 'redescobrir').length,
    recentes: musicas.filter((musica) => musica.aba === 'recentes').length,
    todas: musicas.length,
  }
}

export function agruparCatalogo(musicas: MusicaNaLista[], aba: AbaDoCatalogo, semanas: number): SecaoDoCatalogo[] {
  if (aba === 'redescobrir') {
    return semVazias([
      secao('nunca', 'Sem histórico', porTitulo(musicas.filter((musica) => musica.secao === 'nunca'))),
      secao('paradas', 'Paradas há 3 meses ou mais', daMaisAntiga(musicas.filter((musica) => musica.secao === 'paradas'))),
    ])
  }

  if (aba === 'recentes') {
    const daAba = musicas.filter((musica) => musica.aba === 'recentes')

    return semVazias([
      secao('recente', `Últimas ${semanas} semanas`, daMaisNova(daAba.filter((musica) => musica.recente)), true),
      secao('tres-meses', 'Últimos 3 meses', daMaisNova(daAba.filter((musica) => !musica.recente))),
    ])
  }

  const porLetra = new Map<string, MusicaNaLista[]>()
  for (const musica of porTitulo(musicas)) {
    const letra = letraDe(musica)
    porLetra.set(letra, [...(porLetra.get(letra) ?? []), musica])
  }

  return [...porLetra.entries()].map(([letra, lista]) => secao('letra-' + letra, letra, lista))
}

export function letraDe(musica: Pick<MusicaNaLista, 'titulo'>): string {
  const inicial = normalizarTexto(musica.titulo).charAt(0).toUpperCase()
  return /[A-Z]/.test(inicial) ? inicial : '#'
}

function secao(chave: string, titulo: string, musicas: MusicaNaLista[], atencao = false): SecaoDoCatalogo {
  return { chave, titulo, musicas, atencao }
}

function semVazias(secoes: SecaoDoCatalogo[]): SecaoDoCatalogo[] {
  return secoes.filter((s) => s.musicas.length > 0)
}

function porTitulo(musicas: MusicaNaLista[]): MusicaNaLista[] {
  return [...musicas].sort((a, b) => normalizarTexto(a.titulo).localeCompare(normalizarTexto(b.titulo)))
}

function dataDaUltima(musica: MusicaNaLista): string {
  return musica.ultimaExecucao?.data ?? ''
}

function daMaisAntiga(musicas: MusicaNaLista[]): MusicaNaLista[] {
  return [...musicas].sort((a, b) => dataDaUltima(a).localeCompare(dataDaUltima(b)))
}

function daMaisNova(musicas: MusicaNaLista[]): MusicaNaLista[] {
  return [...musicas].sort((a, b) => dataDaUltima(b).localeCompare(dataDaUltima(a)))
}
