import {
  descricaoDoItem,
  estadoEscala,
  gruposEquipe,
  linkDoVideo,
  membroPorId,
  ministros,
  musicaPorId,
  tituloEscala,
} from '../../src/dominio'
import type { Escala, Item, Ministerio } from '../../src/dominio'
import { resumirMusica } from './musica'

export function apresentarEscala(m: Ministerio, escala: Escala) {
  return {
    ...escala,
    itens: escala.itens.map((item) => apresentarItem(m, item)),
    estado: estadoEscala(escala, m.hoje),
    titulo: tituloEscala(escala),
    grupos: gruposEquipe(m, escala),
  }
}

export function apresentarItem(m: Ministerio, item: Item) {
  const base = { ...item, descricao: descricaoDoItem(m, item) }

  if (item.tipo === 'medley') {
    return {
      ...base,
      trechos: item.trechos.map((trecho) => ({
        ...trecho,
        musica: resumirMusica(m, trecho.musicaId),
        link: linkDoVideo(musicaPorId(m, trecho.musicaId), trecho.inicio),
      })),
    }
  }

  return {
    ...base,
    musica: resumirMusica(m, item.musicaId),
    link: linkDoVideo(musicaPorId(m, item.musicaId), item.tipo === 'trecho' ? item.inicio : null),
  }
}

export function resumirEscala(m: Ministerio, escala: Escala) {
  return {
    id: escala.id,
    data: escala.data,
    horario: escala.horario,
    rotulo: escala.rotulo,
    santaCeia: escala.santaCeia,
    cancelada: escala.cancelada,
    estado: estadoEscala(escala, m.hoje),
    titulo: tituloEscala(escala),
    ministros: ministros(escala).map((id) => membroPorId(m, id).nome),
    membros: escala.equipe.map((entrada) => entrada.membroId),
    quantidadeNaEquipe: escala.equipe.length,
    quantidadeDeItens: escala.itens.length,
  }
}
