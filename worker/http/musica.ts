import {
  abaDaMusica,
  buscaNoCifraClub,
  capaAlternativa,
  capaDaMusica,
  coberturaDoMinisterio,
  ehLegado,
  historicoDaMusica,
  linkDoVideo,
  membroPorId,
  musicaPorId,
  planejadaEm,
  recente,
  secaoDaMusica,
  ultimaExecucao,
  ultimoTom,
  vezesTocada,
  vezesTocadaDesde,
} from '../../src/dominio'
import type { Execucao, Ministerio, Musica } from '../../src/dominio'

export type ContextoDoCatalogo = {
  semanas: number
  comLetra: Set<string>
  escalaId?: string
}

const MESES_DA_CONTAGEM = 6

export function resumirMusica(m: Ministerio, musicaId: string) {
  return comCapas(musicaPorId(m, musicaId))
}

export function comCapas(musica: Musica) {
  return {
    id: musica.id,
    titulo: musica.titulo,
    artista: musica.artista,
    videoId: musica.videoId,
    capa: capaDaMusica(musica.videoId),
    capaAlternativa: capaAlternativa(musica.videoId),
  }
}

export function naListaDeMusicas(m: Ministerio, musica: Musica, contexto: ContextoDoCatalogo) {
  const ultima = ultimaExecucao(m, musica.id)

  return {
    ...comCapas(musica),
    legado: ehLegado(m, musica),
    nova: !musica.legado && !ultima,
    arquivada: musica.arquivada,
    revisar: musica.revisar,
    tomConhecido: musica.tomConhecido,
    tomOriginal: musica.tomOriginal,
    ultimaExecucao: ultima ? apresentarExecucao(m, ultima) : null,
    aba: abaDaMusica(m, musica),
    secao: secaoDaMusica(m, musica),
    recente: recente(m, musica.id, contexto.semanas),
    planejadaEm: planejadaEm(m, musica.id, contexto.escalaId),
    vezesTocada: vezesTocada(m, musica.id),
    vezesEm6Meses: vezesTocadaDesde(m, musica.id, MESES_DA_CONTAGEM),
    temLetra: contexto.comLetra.has(musica.id),
  }
}

export function apresentarMusica(m: Ministerio, musica: Musica, contexto: ContextoDoCatalogo) {
  const sugerido = ultimoTom(m, musica.id)

  return {
    ...naListaDeMusicas(m, musica, contexto),
    link: linkDoVideo(musica),
    cifraClub: buscaNoCifraClub(musica),
    tomSugerido: sugerido && { ...sugerido, ministradoPorNome: nomeDe(m, sugerido.ministradoPor ?? null) },
    historico: historicoDaMusica(m, musica.id).map((execucao) => apresentarExecucao(m, execucao)),
    coberturaDoMinisterio: coberturaDoMinisterio(m, musica.id),
  }
}

export function apresentarExecucao(m: Ministerio, execucao: Execucao) {
  return {
    escalaId: execucao.escalaId,
    data: execucao.data,
    tom: execucao.tom,
    parcial: execucao.parcial,
    ministradoPor: execucao.ministradoPor,
    ministradoPorNome: nomeDe(m, execucao.ministradoPor),
  }
}

function nomeDe(m: Ministerio, membroId: string | null): string | null {
  return membroId ? membroPorId(m, membroId).nome : null
}
