import { musicasDoItem } from '../dominio'
import type { Anexo, ItemApresentado } from './tipos'

export function chaveDoItem(itemId: string): string {
  return 'item:' + itemId
}

export function anexosDoItem(item: ItemApresentado, porDono: Record<string, Anexo[]>): Anexo[] {
  return [
    ...musicasDoItem(item).flatMap((musicaId) => porDono[musicaId] ?? []),
    ...(porDono[chaveDoItem(item.id)] ?? []),
  ]
}
