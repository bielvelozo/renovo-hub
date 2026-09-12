import { useCallback, useEffect, useRef, useState } from 'react'

export const ESPERA_DA_REMOCAO = 5000

type Pendencia = { executar: () => void; temporizador: ReturnType<typeof setTimeout> }

export type RemocaoPendente = {
  pendentes: string[]
  agendar: (id: string, executar: () => void) => void
  desfazer: (id: string) => void
}

export function usarRemocaoPendente(): RemocaoPendente {
  const pendencias = useRef(new Map<string, Pendencia>())
  const [pendentes, listar] = useState<string[]>([])

  const atualizar = () => listar(Array.from(pendencias.current.keys()))

  const concluir = useCallback((id: string) => {
    const pendencia = pendencias.current.get(id)
    if (!pendencia) return
    clearTimeout(pendencia.temporizador)
    pendencias.current.delete(id)
    atualizar()
    pendencia.executar()
  }, [])

  const agendar = useCallback(
    (id: string, executar: () => void) => {
      const anterior = pendencias.current.get(id)
      if (anterior) clearTimeout(anterior.temporizador)
      pendencias.current.set(id, { executar, temporizador: setTimeout(() => concluir(id), ESPERA_DA_REMOCAO) })
      atualizar()
    },
    [concluir],
  )

  const desfazer = useCallback((id: string) => {
    const pendencia = pendencias.current.get(id)
    if (!pendencia) return
    clearTimeout(pendencia.temporizador)
    pendencias.current.delete(id)
    atualizar()
  }, [])

  useEffect(() => {
    const mapa = pendencias.current
    return () => {
      for (const [, pendencia] of mapa) {
        clearTimeout(pendencia.temporizador)
        pendencia.executar()
      }
      mapa.clear()
    }
  }, [])

  return { pendentes, agendar, desfazer }
}
