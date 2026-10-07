import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { indiceSobOPonteiro, mover } from './ordenacao'

const BORDA_PRA_ROLAR = 64
const PASSO_DA_ROLAGEM = 8

export type Ordenacao = {
  ordem: number[]
  arrastando: number | null
  linha: (indice: number) => (elemento: HTMLElement | null) => void
  alca: (indice: number) => {
    onPointerDown: (evento: PointerEvent<HTMLElement>) => void
    onKeyDown: (evento: KeyboardEvent<HTMLElement>) => void
  }
}

export function usarOrdenacao(quantos: number, aoSoltar: (de: number, para: number) => void): Ordenacao {
  const [ordem, definirOrdem] = useState<number[] | null>(null)
  const [arrastando, definirArrastando] = useState<number | null>(null)
  const linhas = useRef<(HTMLElement | null)[]>([])
  const partida = useRef(0)

  const linha = useCallback(
    (indice: number) => (elemento: HTMLElement | null) => {
      linhas.current[indice] = elemento
    },
    [],
  )

  const alca = useCallback(
    (indice: number) => ({
      onPointerDown(evento: PointerEvent<HTMLElement>) {
        if (quantos < 2) return
        evento.preventDefault()
        evento.currentTarget.setPointerCapture(evento.pointerId)

        partida.current = indice
        definirArrastando(indice)
        definirOrdem(sequencia(quantos))

        const alvo = evento.currentTarget
        let atual = indice

        const mexer = (movimento: globalThis.PointerEvent) => {
          rolarSePerto(movimento.clientY)

          const caixas = linhas.current
            .filter((elemento): elemento is HTMLElement => !!elemento)
            .map((elemento) => {
              const caixa = elemento.getBoundingClientRect()
              return { topo: caixa.top, base: caixa.bottom }
            })

          const sob = indiceSobOPonteiro(caixas, movimento.clientY)
          if (sob === null || sob === atual) return

          const de = atual
          atual = sob

          definirOrdem((antes) => mover(antes ?? sequencia(quantos), de, sob))
          definirArrastando(sob)
        }

        const largar = (grava: boolean) => {
          alvo.removeEventListener('pointermove', mexer)
          alvo.removeEventListener('pointerup', soltar)
          alvo.removeEventListener('pointercancel', desistir)

          definirOrdem(null)
          definirArrastando(null)
          if (grava && atual !== partida.current) aoSoltar(partida.current, atual)
        }

        const soltar = () => largar(true)
        const desistir = () => largar(false)

        alvo.addEventListener('pointermove', mexer)
        alvo.addEventListener('pointerup', soltar)
        alvo.addEventListener('pointercancel', desistir)
      },

      onKeyDown(evento: KeyboardEvent<HTMLElement>) {
        const passo = evento.key === 'ArrowUp' ? -1 : evento.key === 'ArrowDown' ? 1 : 0
        if (!passo) return

        const destino = indice + passo
        if (destino < 0 || destino >= quantos) return

        evento.preventDefault()
        aoSoltar(indice, destino)
      },
    }),
    [quantos, aoSoltar],
  )

  return { ordem: ordem ?? sequencia(quantos), arrastando, linha, alca }
}

function sequencia(quantos: number): number[] {
  return Array.from({ length: quantos }, (_, i) => i)
}

function rolarSePerto(y: number): void {
  const area = document.querySelector('.conteudo')
  if (!area) return

  const caixa = area.getBoundingClientRect()

  if (y < caixa.top + BORDA_PRA_ROLAR) area.scrollBy(0, -PASSO_DA_ROLAGEM)
  else if (y > caixa.bottom - BORDA_PRA_ROLAR) area.scrollBy(0, PASSO_DA_ROLAGEM)
}
