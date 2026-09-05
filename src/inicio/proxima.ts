import type { Anexo, EscalaResumida } from '../api/tipos'
import type { EntradaEquipe, Funcao, GrupoEquipe } from '../dominio'

export type Proxima = {
  escala: EscalaResumida
  minha: boolean
}

export function proximaEscala(escalas: EscalaResumida[], membroId: string): Proxima | null {
  const agendadas = escalas
    .filter((escala) => escala.estado === 'agendada')
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))

  const minha = agendadas.find((escala) => escala.membros.includes(membroId))
  if (minha) return { escala: minha, minha: true }

  return agendadas.length ? { escala: agendadas[0], minha: false } : null
}

export function minhaEntrada(equipe: EntradaEquipe[], membroId: string): EntradaEquipe | null {
  return equipe.find((entrada) => entrada.membroId === membroId) ?? null
}

export function textoDaMinhaFuncao(entrada: EntradaEquipe, funcoes: Funcao[]): string {
  const nomes = entrada.funcoes
    .map((id) => funcoes.find((funcao) => funcao.id === id) ?? { id, nome: id, ordem: Number.MAX_SAFE_INTEGER })
    .sort((a, b) => a.ordem - b.ordem)
    .map((funcao) => funcao.nome)

  if (entrada.ministro) return nomes.length ? 'Ministro · ' + nomes.join(', ') : 'Ministro'

  return nomes.length ? nomes.join(', ') : 'sem Função definida'
}

export function textoDeQuemMinistra(grupos: GrupoEquipe[]): string | null {
  const grupo = grupos.find((cada) => cada.nome === 'Ministro' || cada.nome === 'Ministros')

  return grupo ? grupo.itens.join(', ') : null
}

export function anexosPorMusica(anexos: Anexo[]): Record<string, Anexo[]> {
  const mapa: Record<string, Anexo[]> = {}

  for (const anexo of anexos) {
    mapa[anexo.musicaId] = [...(mapa[anexo.musicaId] ?? []), anexo]
  }

  return mapa
}
