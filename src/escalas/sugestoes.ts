import type { MembroResumido, SugestaoApresentada } from '../api/tipos'
import { formatarDia, hojeEmBrasilia } from '../dominio'
import type { Escolha } from './rascunho'

export function diaDaSugestao(carimbo: string, hoje = hojeEmBrasilia()): string {
  return formatarDia(hojeEmBrasilia(new Date(carimbo)), hoje)
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
