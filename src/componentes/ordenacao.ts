export type CaixaDaLinha = { topo: number; base: number }

export function mover<T>(lista: T[], de: number, para: number): T[] {
  if (para < 0 || para >= lista.length || de === para) return lista

  const copia = [...lista]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)

  return copia
}

export function indiceSobOPonteiro(caixas: CaixaDaLinha[], y: number): number | null {
  if (!caixas.length) return null

  const achado = caixas.findIndex((caixa) => y < caixa.base)

  return achado === -1 ? caixas.length - 1 : achado
}
