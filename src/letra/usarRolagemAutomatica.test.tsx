import { act, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usarRolagemAutomatica } from './usarRolagemAutomatica'

const ALTURA_VISIVEL = 300
const ALTURA_TOTAL = 1000
const LIMITE = ALTURA_TOTAL - ALTURA_VISIVEL

function Tela({ ativa, aoParar }: { ativa: boolean; aoParar: () => void }) {
  const alvo = useRef<HTMLDivElement>(null)

  usarRolagemAutomatica(alvo, { ativa, velocidade: 5, aoParar })

  return <div ref={alvo} data-testid="rolagem" style={{ overflowY: 'auto' }} />
}

function montar(aoParar = () => {}) {
  const tela = render(<Tela ativa={false} aoParar={aoParar} />)
  const caixa = screen.getByTestId('rolagem')

  Object.defineProperty(caixa, 'clientHeight', { configurable: true, value: ALTURA_VISIVEL })
  Object.defineProperty(caixa, 'scrollHeight', { configurable: true, value: ALTURA_TOTAL })

  const ligar = () => act(() => void tela.rerender(<Tela ativa aoParar={aoParar} />))

  return { caixa, ligar }
}

function passar(segundos: number) {
  act(() => void vi.advanceTimersByTime(segundos * 1000))
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('rolagem automática da letra', () => {
  it('rola enquanto está ativa', () => {
    const { caixa, ligar } = montar()

    ligar()
    passar(4)

    expect(caixa.scrollTop).toBeGreaterThan(50)
    expect(caixa.scrollTop).toBeLessThan(LIMITE)
  })

  it('para quando a pessoa toca na letra', () => {
    const aoParar = vi.fn()
    const { caixa, ligar } = montar(aoParar)

    ligar()
    passar(2)
    fireEvent.pointerDown(caixa)

    expect(aoParar).toHaveBeenCalled()
  })

  it('para ao chegar no fim', () => {
    const aoParar = vi.fn()
    const { caixa, ligar } = montar(aoParar)

    ligar()
    passar(120)

    expect(caixa.scrollTop).toBe(LIMITE)
    expect(aoParar).toHaveBeenCalled()
  })

  it('não rola parada', () => {
    const { caixa } = montar()

    passar(4)

    expect(caixa.scrollTop).toBe(0)
  })
})
