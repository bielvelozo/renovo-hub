import { membroPorId, musicaPorId, tituloEscala } from '../../src/dominio'
import type { Ministerio } from '../../src/dominio'
import type { Sugestao } from '../dados/sugestoes'
import { naListaDeMusicas } from './musica'
import type { ContextoDoCatalogo } from './musica'

export function apresentarSugestao(m: Ministerio, sugestao: Sugestao, euId: string, contexto: ContextoDoCatalogo) {
  const musicaId = sugestao.musicaId && m.musicas.some((x) => x.id === sugestao.musicaId) ? sugestao.musicaId : null
  const escala = sugestao.escalaId ? m.escalas.find((x) => x.id === sugestao.escalaId) : undefined
  const decididaPor = sugestao.decididaPor && m.membros.some((x) => x.id === sugestao.decididaPor) ? sugestao.decididaPor : null

  return {
    id: sugestao.id,
    membro: resumirMembro(m, sugestao.membroId),
    musica: musicaId ? naListaDeMusicas(m, musicaPorId(m, musicaId), contexto) : null,
    link: sugestao.link,
    titulo: tituloDaSugestao(m, sugestao),
    observacao: sugestao.observacao,
    data: sugestao.data,
    promovidaEm: sugestao.promovidaEm,
    estado: sugestao.estado,
    motivo: sugestao.motivo,
    decididaEm: sugestao.decididaEm,
    decididaPor: decididaPor ? resumirMembro(m, decididaPor) : null,
    escala: escala ? { id: escala.id, data: escala.data, titulo: tituloEscala(escala) } : null,
    apoios: sugestao.apoios.map((id) => resumirMembro(m, id)),
    apoiei: sugestao.apoios.includes(euId),
  }
}

export function tituloDaSugestao(m: Ministerio, sugestao: Sugestao): string {
  const musica = sugestao.musicaId ? m.musicas.find((x) => x.id === sugestao.musicaId) : undefined
  return musica ? musica.titulo : (sugestao.titulo ?? '')
}

function resumirMembro(m: Ministerio, id: string) {
  return { id, nome: membroPorId(m, id).nome }
}
