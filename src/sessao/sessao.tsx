import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ErroDaApi, api } from '../api/cliente'
import { precisaEntrar } from '../api/erros'

export type Eu = {
  id: string
  nome: string
  funcoes: string[]
  ministro: boolean
  admin: boolean
  inativo: boolean
  foto: string | null
  silenciado: boolean
}

export type Situacao =
  | { situacao: 'carregando' }
  | { situacao: 'dentro'; eu: Eu }
  | { situacao: 'fora' }
  | { situacao: 'erro'; mensagem: string }

const ContextoDoEu = createContext<Eu | null>(null)
const ContextoDaTrocaDoEu = createContext<((eu: Eu) => void) | null>(null)

export function ProvedorDoEu({
  eu,
  trocar = () => {},
  children,
}: {
  eu: Eu
  trocar?: (eu: Eu) => void
  children: ReactNode
}) {
  return (
    <ContextoDoEu value={eu}>
      <ContextoDaTrocaDoEu value={trocar}>{children}</ContextoDaTrocaDoEu>
    </ContextoDoEu>
  )
}

export function usarEu(): Eu {
  const eu = useContext(ContextoDoEu)
  if (!eu) throw new Error('usarEu precisa do ProvedorDoEu por cima.')
  return eu
}

export function usarEuTalvez(): Eu | null {
  return useContext(ContextoDoEu)
}

export function usarTrocaDoEu(): (eu: Eu) => void {
  const trocar = useContext(ContextoDaTrocaDoEu)
  if (!trocar) throw new Error('usarTrocaDoEu precisa do ProvedorDoEu por cima.')
  return trocar
}

export function usarSessao(): Situacao & { recarregar: () => void; trocarEu: (eu: Eu) => void } {
  const [situacao, guardar] = useState<Situacao>({ situacao: 'carregando' })
  const [tentativa, tentarDeNovo] = useState(0)

  useEffect(() => {
    const controle = new AbortController()

    api<Eu>('/api/eu', { sinal: controle.signal })
      .then((eu) => guardar({ situacao: 'dentro', eu }))
      .catch((erro: unknown) => {
        if (controle.signal.aborted) return
        if (erro instanceof ErroDaApi && precisaEntrar(erro.status)) return guardar({ situacao: 'fora' })
        guardar({ situacao: 'erro', mensagem: erro instanceof Error ? erro.message : 'Não consegui carregar.' })
      })

    return () => controle.abort()
  }, [tentativa])

  const recarregar = useCallback(() => tentarDeNovo((n) => n + 1), [])
  const trocarEu = useCallback((eu: Eu) => guardar({ situacao: 'dentro', eu }), [])

  return { ...situacao, recarregar, trocarEu }
}
