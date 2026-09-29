import type { Bloco, Letra } from '../dominio'

export type ParteDaLetra = { titulo: string; letra: Letra | null }

export function contarLinhas(letra: Letra): number {
  return letra.blocos.reduce(
    (quantas, bloco) => quantas + (bloco.tipo === 'marcador' ? 1 : bloco.linhas.length),
    0,
  )
}

// O Word marca a seção com barras ou asteriscos; na tela fica só o nome dela.
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
