import { musicasDoItem } from '../dominio'
import type { Anexo, ItemApresentado } from './tipos'

export function chaveDoItem(itemId: string): string {
  return 'item:' + itemId
}

export function temLetraNoItem(item: ItemApresentado, porDono: Record<string, Anexo[]>): boolean {
  const maisNovoTemLetra = (chave: string) => !!(porDono[chave] ?? [])[0]?.temLetra

  if (item.tipo === 'medley' && maisNovoTemLetra(chaveDoItem(item.id))) return true

  return musicasDoItem(item).some(maisNovoTemLetra)
}
