import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CHAVE_DO_TEMA, COR_DA_BARRA, lerPreferencia, proximaPreferencia, temaEfetivo } from './tema'
import type { Preferencia, Tema } from './tema'

type Valor = {
  preferencia: Preferencia
  tema: Tema
  definir: (preferencia: Preferencia) => void
  alternar: () => void
}

const ContextoDoTema = createContext<Valor | null>(null)

const CONSULTA_ESCURA = '(prefers-color-scheme: dark)'

export function ProvedorDeTema({ children }: { children: ReactNode }) {
  const [preferencia, definir] = useState<Preferencia>(() => lerPreferencia(guardado()))
  const [sistemaEscuro, marcarSistema] = useState(() => window.matchMedia(CONSULTA_ESCURA).matches)

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_ESCURA)
    const ouvir = (evento: MediaQueryListEvent) => marcarSistema(evento.matches)
    consulta.addEventListener('change', ouvir)
    return () => consulta.removeEventListener('change', ouvir)
  }, [])

  const tema = temaEfetivo(preferencia, sistemaEscuro)

  useEffect(() => {
    const raiz = document.documentElement
    if (preferencia === 'automatico') delete raiz.dataset.tema
    else raiz.dataset.tema = preferencia

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_DA_BARRA[tema])

    try {
      localStorage.setItem(CHAVE_DO_TEMA, preferencia)
    } catch {
      // Navegador com armazenamento bloqueado: o tema vale só nesta sessão.
    }
  }, [preferencia, tema])

  const alternar = useCallback(() => definir(proximaPreferencia(preferencia)), [preferencia])
  const valor = useMemo(() => ({ preferencia, tema, definir, alternar }), [preferencia, tema, alternar])

  return <ContextoDoTema value={valor}>{children}</ContextoDoTema>
}

export function usarTema(): Valor {
  const valor = useContext(ContextoDoTema)
  if (!valor) throw new Error('usarTema precisa do ProvedorDeTema por cima.')
  return valor
}

function guardado(): string | null {
  try {
    return localStorage.getItem(CHAVE_DO_TEMA)
  } catch {
    return null
  }
}
