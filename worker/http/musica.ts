import {
  buscaNoCifraClub,
  capaAlternativa,
  capaDaMusica,
  ehLegado,
  historicoDaMusica,
  linkDoVideo,
  membroPorId,
  musicaPorId,
  ultimaExecucao,
  ultimoTom,
} from '../../src/dominio'
import type { Execucao, Ministerio, Musica } from '../../src/dominio'

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

export function naListaDeMusicas(m: Ministerio, musica: Musica) {
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
  }
}

export function apresentarMusica(m: Ministerio, musica: Musica) {
  const sugerido = ultimoTom(m, musica.id)

  return {
    ...naListaDeMusicas(m, musica),
    link: linkDoVideo(musica),
    cifraClub: buscaNoCifraClub(musica),
    tomSugerido: sugerido && { ...sugerido, ministradoPorNome: nomeDe(m, sugerido.ministradoPor ?? null) },
    historico: historicoDaMusica(m, musica.id).map((execucao) => apresentarExecucao(m, execucao)),
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
