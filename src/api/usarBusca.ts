import { useCallback, useEffect, useState } from 'react'
import { apiComMeta, textoDoErro } from './cliente'
import { horaVista } from './visto'

export type Busca<T> = {
  dados: T | null
  erro: string | null
  carregando: boolean
  vistoEm: string | null
  recarregar: () => void
  definir: (dados: T) => void
}

type Guardado<T> = { caminho: string; dados: T; vistoEm: string | null }

const cache = new Map<string, Guardado<unknown>>()

export function usarBusca<T>(caminho: string | null): Busca<T> {
  const [resultado, guardar] = useState<Guardado<T> | null>(null)
  const [falha, guardarFalha] = useState<{ caminho: string; erro: string } | null>(null)
  const [versao, avancar] = useState(0)

  useEffect(() => {
    if (caminho === null) return

    const controle = new AbortController()

    apiComMeta<T>(caminho, { sinal: controle.signal })
      .then(({ dados, data }) => {
        const guardado = { caminho, dados, vistoEm: horaVista(data, new Date()) }
        cache.set(caminho, guardado)
        guardar(guardado)
        guardarFalha(null)
      })
      .catch((problema: unknown) => {
        if (!controle.signal.aborted) guardarFalha({ caminho, erro: textoDoErro(problema) })
      })

    return () => controle.abort()
  }, [caminho, versao])

  const recarregar = useCallback(() => avancar((n) => n + 1), [])
  const definir = useCallback(
    (dados: T) => {
      const guardado = { caminho: caminho ?? '', dados, vistoEm: resultado?.vistoEm ?? null }
      if (caminho !== null) cache.set(caminho, guardado)
      guardar(guardado)
    },
    [caminho, resultado?.vistoEm],
  )

  const atual =
    resultado?.caminho === caminho ? resultado : caminho !== null ? (cache.get(caminho) as Guardado<T> | undefined) ?? null : null
  const erro = falha?.caminho === caminho ? falha.erro : null

  return {
    dados: atual?.dados ?? null,
    erro,
    carregando: caminho !== null && !atual && !erro,
    vistoEm: atual?.vistoEm ?? null,
    recarregar,
    definir,
  }
}
