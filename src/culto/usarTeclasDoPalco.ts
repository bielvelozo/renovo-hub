import { useEffect } from 'react'
import type { RefObject } from 'react'
import { acaoDaTecla } from './culto'

const PASSO_DA_ROLAGEM = 0.85

export function usarTeclasDoPalco(
  corpo: RefObject<HTMLElement | null>,
  trocar?: (lado: 'anterior' | 'seguinte') => void,
): void {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.target instanceof Element && evento.target.closest('button, a, input, textarea, select')) return

      const acao = acaoDaTecla(evento.key, evento.shiftKey)
      if (!acao) return

      evento.preventDefault()

      if (acao === 'anterior' || acao === 'seguinte') {
        if (!evento.repeat) trocar?.(acao)
        return
      }

      const caixa = corpo.current
      caixa?.scrollBy?.({
        top: (acao === 'descer' ? 1 : -1) * caixa.clientHeight * PASSO_DA_ROLAGEM,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [corpo, trocar])
}
