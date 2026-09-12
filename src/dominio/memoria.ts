import { diasEntre } from './datas'
import { ehMusical, estadoEscala, membroPorId, ministros, musicasDoItem, tituloEscala } from './escala'
import { historicoDaMusica, ultimaExecucao } from './execucoes'
import { mesesDesde } from './musica'
import type { Execucao, Ministerio, Musica } from './tipos'

export const MESES_PARA_REDESCOBRIR = 3

export type AbaDaMusica = 'redescobrir' | 'recentes'

export type SecaoDaMusica = 'nunca' | 'paradas' | null

export type MemoriaDaMusica = {
  recente: boolean
  ultimaExecucao: Execucao | null
  planejadaEm: Planejada[]
}

export type Planejada = {
  escalaId: string
  data: string
  titulo: string
  ministros: string[]
}

export function recente(m: Ministerio, musicaId: string, semanas: number): boolean {
  const ultima = ultimaExecucao(m, musicaId)
  if (!ultima) return false

  return diasEntre(ultima.data, m.hoje) < semanas * 7
}

export function planejadaEm(m: Ministerio, musicaId: string, escalaAtualId?: string): Planejada[] {
  return m.escalas
    .filter((escala) => escala.id !== escalaAtualId && estadoEscala(escala, m.hoje) === 'agendada')
    .filter((escala) => escala.itens.some((item) => musicasDoItem(item).includes(musicaId)))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((escala) => ({
      escalaId: escala.id,
      data: escala.data,
      titulo: tituloEscala(escala),
      ministros: ministros(escala).map((id) => membroPorId(m, id).nome),
    }))
}

export function vezesTocadaDesde(m: Ministerio, musicaId: string, meses: number): number {
  return historicoDaMusica(m, musicaId).filter((x) => mesesDesde(x.data, m.hoje) < meses).length
}

export function abaDaMusica(m: Ministerio, musica: Musica): AbaDaMusica {
  const ultima = ultimaExecucao(m, musica.id)
  if (!ultima) return 'redescobrir'

  return mesesDesde(ultima.data, m.hoje) >= MESES_PARA_REDESCOBRIR ? 'redescobrir' : 'recentes'
}

export function secaoDaMusica(m: Ministerio, musica: Musica): SecaoDaMusica {
  if (!ultimaExecucao(m, musica.id)) return 'nunca'

  return abaDaMusica(m, musica) === 'redescobrir' ? 'paradas' : null
}

export function coberturaDoMinisterio(m: Ministerio, musicaId: string): { ja: string[]; nunca: string[] } {
  const quemJa = new Set(historicoDaMusica(m, musicaId).flatMap((x) => x.membros))
  const ja: string[] = []
  const nunca: string[] = []

  for (const membro of m.membros) {
    if (membro.inativo || !membro.funcoes.some((funcaoId) => ehMusical(m, funcaoId))) continue
    ;(quemJa.has(membro.id) ? ja : nunca).push(membro.nome)
  }

  return { ja, nunca }
}

export function memoriaDaMusica(
  m: Ministerio,
  musicaId: string,
  semanas: number,
  escalaAtualId?: string,
): MemoriaDaMusica {
  return {
    recente: recente(m, musicaId, semanas),
    ultimaExecucao: ultimaExecucao(m, musicaId),
    planejadaEm: planejadaEm(m, musicaId, escalaAtualId),
  }
}
