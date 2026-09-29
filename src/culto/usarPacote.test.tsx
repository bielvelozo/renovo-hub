import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pacote } from '../api/tipos'
import { baixarPacote } from './pacote'
import { usarPacote } from './usarPacote'

vi.mock('./pacote', () => ({
  baixarPacote: vi.fn(),
  pacoteDoAparelho: () => null,
  assinarPacote: () => () => {},
}))

const PACOTE: Pacote = { geradoEm: '2026-09-20T20:00:00.000Z', escalas: [], catalogo: [] }

beforeEach(() => {
  vi.mocked(baixarPacote).mockReset()
  vi.mocked(baixarPacote).mockResolvedValue(PACOTE)
})

describe('pulso do pacote', () => {
  it('baixa de novo ao ficar online e ao voltar para o app', async () => {
    renderHook(() => usarPacote())

    await act(async () => {
      window.dispatchEvent(new Event('online'))
    })
    expect(baixarPacote).toHaveBeenCalledTimes(1)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(baixarPacote).toHaveBeenCalledTimes(2)
  })

  it('não baixa duas vezes ao mesmo tempo', async () => {
    let terminar: (pacote: Pacote) => void = () => {}
    vi.mocked(baixarPacote).mockImplementationOnce(() => new Promise((resolver) => (terminar = resolver)))
    const { result } = renderHook(() => usarPacote())

    act(() => {
      result.current.baixar()
      result.current.baixar()
    })
    expect(baixarPacote).toHaveBeenCalledTimes(1)
    expect(result.current.baixando).toBe(true)

    await act(async () => terminar(PACOTE))
    expect(result.current.baixando).toBe(false)

    act(() => result.current.baixar())
    expect(baixarPacote).toHaveBeenCalledTimes(2)
  })
})
