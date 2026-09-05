import { useCallback, useEffect, useState } from 'react'
import { api, textoDoErro } from './cliente'

export type Busca<T> = {
  dados: T | null
  erro: string | null
  carregando: boolean
  recarregar: () => void
  definir: (dados: T) => void
}

export function usarBusca<T>(caminho: string | null): Busca<T> {
  const [dados, definir] = useState<T | null>(null)
  const [erro, guardarErro] = useState<string | null>(null)
  const [versao, avancar] = useState(0)

  useEffect(() => {
    if (caminho === null) return

    const controle = new AbortController()

    api<T>(caminho, { sinal: controle.signal })
      .then((recebido) => {
        definir(recebido)
        guardarErro(null)
      })
      .catch((problema: unknown) => {
        if (!controle.signal.aborted) guardarErro(textoDoErro(problema))
      })

    return () => controle.abort()
  }, [caminho, versao])

  const recarregar = useCallback(() => avancar((n) => n + 1), [])

  return { dados, erro, carregando: caminho !== null && !dados && !erro, recarregar, definir }
}
