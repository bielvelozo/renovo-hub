import { useCallback, useRef, useState } from 'react'
import { textoDoErro } from './cliente'

export type Acao = {
  ocupado: boolean
  erro: string | null
  executar: (tarefa: () => Promise<void>) => void
  limpar: () => void
}

export function usarAcao(): Acao {
  const [pendentes, contar] = useState(0)
  const [erro, guardar] = useState<string | null>(null)
  const fila = useRef<Promise<void>>(Promise.resolve())

  const executar = useCallback((tarefa: () => Promise<void>) => {
    contar((n) => n + 1)

    fila.current = fila.current.then(async () => {
      try {
        await tarefa()
      } catch (problema) {
        guardar(textoDoErro(problema))
      } finally {
        contar((n) => n - 1)
      }
    })
  }, [])

  const limpar = useCallback(() => guardar(null), [])

  return { ocupado: pendentes > 0, erro, executar, limpar }
}
