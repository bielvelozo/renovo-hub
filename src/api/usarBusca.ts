import { useCallback, useEffect, useRef, useState } from 'react'
import { guardarBusca, lerGuardado } from './cache'
import type { Guardado } from './cache'
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

export function usarBusca<T>(caminho: string | null): Busca<T> {
  const [resultado, guardar] = useState<Guardado<T> | null>(null)
  const [falha, guardarFalha] = useState<{ caminho: string; erro: string } | null>(null)
  const [versao, avancar] = useState(0)
  const emVoo = useRef<AbortController | null>(null)

  useEffect(() => {
    if (caminho === null) return

    const controle = new AbortController()
    emVoo.current = controle

    apiComMeta<T>(caminho, { sinal: controle.signal })
      .then(({ dados, data }) => {
        const guardado = { caminho, dados, vistoEm: horaVista(data, new Date()) }
        guardarBusca(guardado)
        guardar(guardado)
        guardarFalha(null)
      })
      .catch((problema: unknown) => {
        if (controle.signal.aborted) return
        if (!lerGuardado(caminho)) guardarFalha({ caminho, erro: textoDoErro(problema) })
      })

    return () => controle.abort()
  }, [caminho, versao])

  const atual =
    resultado?.caminho === caminho ? resultado : caminho !== null ? (lerGuardado<T>(caminho) ?? null) : null
  const erro = falha?.caminho === caminho ? falha.erro : null
  const vistoEm = atual?.vistoEm ?? null

  const recarregar = useCallback(() => avancar((n) => n + 1), [])
  const definir = useCallback(
    (dados: T) => {
      emVoo.current?.abort()
      const guardado = { caminho: caminho ?? '', dados, vistoEm }
      if (caminho !== null) guardarBusca(guardado)
      guardar(guardado)
    },
    [caminho, vistoEm],
  )

  return {
    dados: atual?.dados ?? null,
    erro,
    carregando: caminho !== null && !atual && !erro,
    vistoEm,
    recarregar,
    definir,
  }
}
