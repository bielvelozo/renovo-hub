import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { pxPorSegundo } from './leitura'

type Opcoes = {
  ativa: boolean
  velocidade: number
  aoParar: () => void
}

const INTERRUPCOES = ['pointerdown', 'wheel', 'touchmove'] as const

export function usarRolagemAutomatica(alvo: RefObject<HTMLElement | null>, { ativa, velocidade, aoParar }: Opcoes) {
  const parar = useRef(aoParar)
  parar.current = aoParar

  useEffect(() => {
    if (!ativa) return

    const caixa = containerDeRolagem(alvo.current)
    if (!caixa) return

    let quadro = 0
    let ultimo: number | null = null
    let posicao = caixa.scrollTop

    const andar = (agora: number) => {
      if (ultimo !== null) posicao += ((agora - ultimo) / 1000) * pxPorSegundo(velocidade)
      ultimo = agora

      const fim = caixa.scrollHeight - caixa.clientHeight
      if (posicao >= fim) {
        caixa.scrollTop = fim
        parar.current()
        return
      }

      caixa.scrollTop = posicao
      quadro = requestAnimationFrame(andar)
    }

    quadro = requestAnimationFrame(andar)

    const interromper = () => parar.current()
    for (const evento of INTERRUPCOES) caixa.addEventListener(evento, interromper, { passive: true })

    return () => {
      cancelAnimationFrame(quadro)
      for (const evento of INTERRUPCOES) caixa.removeEventListener(evento, interromper)
    }
  }, [ativa, velocidade, alvo])
}

export function containerDeRolagem(desde: HTMLElement | null): HTMLElement | null {
  for (let no = desde; no; no = no.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(no).overflowY)) return no
  }

  return document.scrollingElement as HTMLElement | null
}
