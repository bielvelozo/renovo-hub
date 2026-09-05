import type { MembroResumido } from '../api/tipos'
import { formatarDia } from '../dominio'

export function diaDaSugestao(data: string): string {
  return formatarDia(data.slice(0, 10))
}

export function textoDosApoios(apoios: MembroResumido[]): string {
  if (apoios.length === 0) return 'ninguém apoiou ainda'

  return apoios.map((apoio) => apoio.nome).join(', ') + (apoios.length > 1 ? ' apoiam' : ' apoia')
}
