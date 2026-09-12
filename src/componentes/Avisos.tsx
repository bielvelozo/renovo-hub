import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Botao } from './Botao'

export const DURACAO_DO_AVISO = 5000
const TEMPO_DE_SAIDA = 200

export type OpcoesDoAviso = { desfazer?: () => void }

export type Avisar = (texto: string, opcoes?: OpcoesDoAviso) => void

type Aviso = { id: number; texto: string; desfazer?: () => void; saindo: boolean }

const ContextoDeAvisos = createContext<Avisar | null>(null)

export function ProvedorDeAvisos({ children }: { children: ReactNode }) {
  const [aviso, mostrar] = useState<Aviso | null>(null)
  const proximo = useRef(0)
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([])

  const limparTemporizadores = () => {
    temporizadores.current.forEach(clearTimeout)
    temporizadores.current = []
  }

  const sair = useCallback((id: number) => {
    mostrar((atual) => (atual?.id === id ? { ...atual, saindo: true } : atual))
    temporizadores.current.push(setTimeout(() => mostrar((atual) => (atual?.id === id ? null : atual)), TEMPO_DE_SAIDA))
  }, [])

  const avisar = useCallback<Avisar>(
    (texto, opcoes = {}) => {
      limparTemporizadores()
      const id = ++proximo.current
      mostrar({ id, texto, desfazer: opcoes.desfazer, saindo: false })
      temporizadores.current.push(setTimeout(() => sair(id), DURACAO_DO_AVISO))
    },
    [sair],
  )

  useEffect(() => limparTemporizadores, [])

  const desfazer = () => {
    if (!aviso) return
    aviso.desfazer?.()
    limparTemporizadores()
    sair(aviso.id)
  }

  const valor = useMemo(() => avisar, [avisar])

  return (
    <ContextoDeAvisos value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {aviso && (
          <div key={aviso.id} className={`aviso-de-rodape${aviso.saindo ? ' saindo' : ''}`}>
            <span className="texto-do-aviso">{aviso.texto}</span>
            {aviso.desfazer && (
              <Botao variante="terciario" pequeno className="desfazer" onClick={desfazer}>
                Desfazer
              </Botao>
            )}
          </div>
        )}
      </div>
    </ContextoDeAvisos>
  )
}

export function usarAvisoTalvez(): Avisar | null {
  return useContext(ContextoDeAvisos)
}

export function usarAviso(): Avisar {
  const avisar = useContext(ContextoDeAvisos)
  if (!avisar) throw new Error('usarAviso precisa do ProvedorDeAvisos por cima.')
  return avisar
}
