export type Guardado<T> = { caminho: string; dados: T; vistoEm: string | null }

const cache = new Map<string, Guardado<unknown>>()

export function lerGuardado<T>(caminho: string): Guardado<T> | undefined {
  return cache.get(caminho) as Guardado<T> | undefined
}

export function guardarBusca(guardado: Guardado<unknown>) {
  cache.set(guardado.caminho, guardado)
}

export function esquecerBuscas() {
  cache.clear()
}
