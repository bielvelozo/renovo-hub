import { membroPorId, musicaPorId } from '../../src/dominio'
import type { Ministerio } from '../../src/dominio'
import type { Sugestao } from '../dados/sugestoes'
import { resumirMusica } from './musica'

export function apresentarSugestao(m: Ministerio, sugestao: Sugestao, euId: string) {
  const musica = sugestao.musicaId && m.musicas.some((x) => x.id === sugestao.musicaId) ? sugestao.musicaId : null

  return {
    id: sugestao.id,
    membro: resumirMembro(m, sugestao.membroId),
    musica: musica ? resumirMusica(m, musica) : null,
    link: sugestao.link,
    titulo: musica ? musicaPorId(m, musica).titulo : (sugestao.titulo ?? ''),
    observacao: sugestao.observacao,
    data: sugestao.data,
    promovidaEm: sugestao.promovidaEm,
    apoios: sugestao.apoios.map((id) => resumirMembro(m, id)),
    apoiei: sugestao.apoios.includes(euId),
  }
}

function resumirMembro(m: Ministerio, id: string) {
  return { id, nome: membroPorId(m, id).nome }
}
