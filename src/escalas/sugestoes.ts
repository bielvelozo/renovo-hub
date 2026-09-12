import type { MembroResumido, SugestaoApresentada } from '../api/tipos'
import { formatarDia, hojeEmBrasilia, tempoRelativo } from '../dominio'
import type { Escolha } from './rascunho'

export const CHAVE_DE_VISITA_DAS_SUGESTOES = 'renovo:sugestoes-vistas-em'

export function diaDaSugestao(carimbo: string, hoje = hojeEmBrasilia()): string {
  return formatarDia(hojeEmBrasilia(new Date(carimbo)), hoje)
}

export function tempoDaSugestao(carimbo: string, hoje = hojeEmBrasilia()): string {
  return tempoRelativo(hojeEmBrasilia(new Date(carimbo)), hoje)
}

export function textoDeQuemSugeriu(sugestao: SugestaoApresentada, hoje = hojeEmBrasilia()): string {
  return `${sugestao.membro.nome} sugeriu · ${tempoDaSugestao(sugestao.data, hoje)}`
}

export function textoDeGuardada(decididaEm: string, hoje = hojeEmBrasilia()): string {
  return `guardada ${tempoDaSugestao(decididaEm, hoje)}`
}

export function textoDeAceita(sugestao: SugestaoApresentada, hoje = hojeEmBrasilia()): string {
  const quem = sugestao.decididaPor?.nome
  if (!sugestao.escala) return quem ? `entrou · ${quem}` : 'entrou numa escala'
  return `entrou em ${formatarDia(sugestao.escala.data, hoje)}${quem ? ` · ${quem}` : ''}`
}

export function textoDeRecusada(motivo: string): string {
  return motivo ? `não entrou · ${motivo}` : 'não entrou'
}

export function novasDesde(sugestoes: SugestaoApresentada[], vistasEm: string | null): SugestaoApresentada[] {
  return sugestoes.filter((sugestao) => sugestao.estado === 'aberta' && (!vistasEm || sugestao.data > vistasEm))
}

export function contarNovas(sugestoes: SugestaoApresentada[], vistasEm: string | null): number {
  return novasDesde(sugestoes, vistasEm).length
}

export function textoDosApoios(apoios: MembroResumido[]): string {
  if (apoios.length === 0) return 'ninguém apoiou ainda'

  return apoios.map((apoio) => apoio.nome).join(', ') + (apoios.length > 1 ? ' apoiam' : ' apoia')
}

export function corpoDaSugestao(escolha: Escolha, observacao: string) {
  const comum = { observacao: observacao.trim() }

  if (escolha.musicaId) return { musicaId: escolha.musicaId, ...comum }

  return { link: escolha.link, titulo: escolha.resumo.titulo, ...comum }
}

export function podeApagar(sugestao: SugestaoApresentada, eu: { id: string; admin: boolean }): boolean {
  return eu.admin || eu.id === sugestao.membro.id
}
