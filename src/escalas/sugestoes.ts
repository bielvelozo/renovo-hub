import type { MembroResumido } from '../api/tipos'
import { formatarDia, hojeEmBrasilia } from '../dominio'

export function diaDaSugestao(carimbo: string): string {
  return formatarDia(hojeEmBrasilia(new Date(carimbo)))
}

export function textoDosApoios(apoios: MembroResumido[]): string {
  if (apoios.length === 0) return 'ninguém apoiou ainda'

  return apoios.map((apoio) => apoio.nome).join(', ') + (apoios.length > 1 ? ' apoiam' : ' apoia')
}
