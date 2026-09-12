import {
  descricaoDoItem,
  estadoEscala,
  funcaoPorId,
  gruposEquipe,
  linkDoVideo,
  membroPorId,
  memoriaDaMusica,
  ministros,
  musicaPorId,
  pendenciasDaEscala,
  resumoDoRepertorio,
  tituloEscala,
} from '../../src/dominio'
import type { Escala, Item, Ministerio } from '../../src/dominio'
import { apresentarExecucao, resumirMusica } from './musica'

export function apresentarEscala(m: Ministerio, escala: Escala, semanas: number) {
  return {
    ...escala,
    itens: escala.itens.map((item) => apresentarItem(m, item, semanas, escala.id)),
    estado: estadoEscala(escala, m.hoje),
    titulo: tituloEscala(escala),
    grupos: gruposEquipe(m, escala),
    resumoDoRepertorio: resumoDoRepertorio(m, escala, semanas),
  }
}

export function apresentarItem(m: Ministerio, item: Item, semanas: number, escalaAtualId: string) {
  const base = {
    ...item,
    atualizadoEm: item.atualizadoEm ?? null,
    ministradoPorNome: item.ministradoPor ? membroPorId(m, item.ministradoPor).nome : null,
    descricao: descricaoDoItem(m, item),
  }

  if (item.tipo === 'medley') {
    return {
      ...base,
      memoria: null,
      trechos: item.trechos.map((trecho) => ({
        ...trecho,
        musica: resumirMusica(m, trecho.musicaId),
        link: linkDoVideo(musicaPorId(m, trecho.musicaId), trecho.inicio),
        memoria: apresentarMemoria(m, trecho.musicaId, semanas, escalaAtualId),
      })),
    }
  }

  return {
    ...base,
    musica: resumirMusica(m, item.musicaId),
    link: linkDoVideo(musicaPorId(m, item.musicaId), item.tipo === 'trecho' ? item.inicio : null),
    memoria: apresentarMemoria(m, item.musicaId, semanas, escalaAtualId),
  }
}

export function resumirEscala(m: Ministerio, escala: Escala, membroId?: string) {
  const { pendencias, pronta, porGrupo } = pendenciasDaEscala(m, escala)
  const minha = membroId ? escala.equipe.find((entrada) => entrada.membroId === membroId) : undefined

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
    pendencias,
    pronta,
    porGrupo,
    minhasFuncoes: (minha?.funcoes ?? []).map((id) => funcaoPorId(m, id).nome),
  }
}

function apresentarMemoria(m: Ministerio, musicaId: string, semanas: number, escalaAtualId: string) {
  const memoria = memoriaDaMusica(m, musicaId, semanas, escalaAtualId)

  return {
    ...memoria,
    ultimaExecucao: memoria.ultimaExecucao ? apresentarExecucao(m, memoria.ultimaExecucao) : null,
  }
}
