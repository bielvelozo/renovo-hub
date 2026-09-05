import { capaAlternativa, capaDaMusica, musicaPorId } from '../../src/dominio'
import type { Ministerio, Musica } from '../../src/dominio'

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
