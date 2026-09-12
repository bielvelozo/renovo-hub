import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ESPERA_DA_REMOCAO, usarRemocaoPendente } from './usarRemocaoPendente'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('usarRemocaoPendente', () => {
  it('esconde o item na hora e só executa depois da espera', () => {
    const executar = vi.fn()
    const { result } = renderHook(() => usarRemocaoPendente())

    act(() => result.current.agendar('item-1', executar))
    expect(result.current.pendentes).toEqual(['item-1'])
    expect(executar).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(ESPERA_DA_REMOCAO - 1))
    expect(executar).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(executar).toHaveBeenCalledTimes(1)
    expect(result.current.pendentes).toEqual([])
  })

  it('desfazer cancela a chamada e traz o item de volta', () => {
    const executar = vi.fn()
    const { result } = renderHook(() => usarRemocaoPendente())

    act(() => result.current.agendar('item-1', executar))
    act(() => result.current.desfazer('item-1'))
    expect(result.current.pendentes).toEqual([])

    act(() => vi.advanceTimersByTime(ESPERA_DA_REMOCAO))
    expect(executar).not.toHaveBeenCalled()
  })

  it('executa na hora quando a tela desmonta', () => {
    const executar = vi.fn()
    const { result, unmount } = renderHook(() => usarRemocaoPendente())

    act(() => result.current.agendar('item-1', executar))
    unmount()
    expect(executar).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(ESPERA_DA_REMOCAO))
    expect(executar).toHaveBeenCalledTimes(1)
  })
})
