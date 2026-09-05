import { escalaPorId, estadoEscala, membroPorId, membrosMusicais, ministradoPorDe, musicaPorId } from './escala'
import type { Execucao, Ministerio, Musica, TomSugerido } from './tipos'

export function execucoes(m: Ministerio): Execucao[] {
  const derivadas: Execucao[] = []

  for (const escala of m.escalas) {
    if (estadoEscala(escala, m.hoje) !== 'realizada') continue
    const musicais = membrosMusicais(m, escala)

    for (const item of escala.itens) {
      const ministradoPor = ministradoPorDe(escala, item)
      const base = { escalaId: escala.id, data: escala.data, ministradoPor, membros: musicais }

      if (item.tipo === 'medley') {
        for (const trecho of item.trechos) {
          derivadas.push({ ...base, musicaId: trecho.musicaId, tom: trecho.tom, parcial: true })
        }
      } else {
        derivadas.push({ ...base, musicaId: item.musicaId, tom: item.tom, parcial: item.tipo === 'trecho' })
      }
    }
  }

  return derivadas.sort((a, b) => b.data.localeCompare(a.data))
}

export function historicoDaMusica(m: Ministerio, musicaId: string): Execucao[] {
  return execucoes(m).filter((x) => x.musicaId === musicaId)
}

export function ultimaExecucao(m: Ministerio, musicaId: string): Execucao | null {
  return historicoDaMusica(m, musicaId)[0] ?? null
}

export function ultimoTom(m: Ministerio, musicaId: string): TomSugerido | null {
  const ultima = ultimaExecucao(m, musicaId)
  if (ultima) {
    return {
      tom: ultima.tom,
      origem: 'execucao',
      data: ultima.data,
      ministradoPor: ultima.ministradoPor,
      parcial: ultima.parcial,
    }
  }

  const musica = musicaPorId(m, musicaId)
  if (musica.tomConhecido) return { tom: musica.tomConhecido, origem: 'conhecido' }
  if (musica.tomOriginal) return { tom: musica.tomOriginal, origem: 'original' }
  return null
}

export function ehLegado(m: Ministerio, musica: Musica): boolean {
  return musica.legado && historicoDaMusica(m, musica.id).length === 0
}

export function cobertura(m: Ministerio, escalaId: string, musicaId: string): { ja: string[]; nunca: string[] } {
  const escala = escalaPorId(m, escalaId)
  const quemJa = new Set(historicoDaMusica(m, musicaId).flatMap((x) => x.membros))
  const ja: string[] = []
  const nunca: string[] = []

  for (const membroId of membrosMusicais(m, escala)) {
    ;(quemJa.has(membroId) ? ja : nunca).push(membroPorId(m, membroId).nome)
  }

  return { ja, nunca }
}
