import {
  estadoEscala,
  gruposEquipe,
  membroPorId,
  ministros,
  tituloEscala,
} from '../../src/dominio'
import type { Escala, Ministerio } from '../../src/dominio'

export function apresentarEscala(m: Ministerio, escala: Escala) {
  return {
    ...escala,
    estado: estadoEscala(escala, m.hoje),
    titulo: tituloEscala(escala),
    grupos: gruposEquipe(m, escala),
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
    quantidadeNaEquipe: escala.equipe.length,
    quantidadeDeItens: escala.itens.length,
  }
}
