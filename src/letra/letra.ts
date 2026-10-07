import type { Bloco, Letra } from '../dominio'

export type ParteDaLetra = { titulo: string; letra: Letra | null }

export function textoDoMarcador(texto: string): string {
  return texto
    .replace(/^\/+/, '')
    .replace(/^\*+|\*+$/g, '')
    .trim()
}

export function juntarLetras(partes: ParteDaLetra[]): Letra | null {
  const blocos: Bloco[] = []

  for (const parte of partes) {
    if (!parte.letra) continue

    blocos.push({ tipo: 'marcador', texto: parte.titulo }, ...parte.letra.blocos)
  }

  return blocos.length ? { cabecalho: [], blocos } : null
}
