import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DURACAO_DO_AVISO, ProvedorDeAvisos, usarAviso } from './Avisos'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function Tela({ desfazer }: { desfazer?: () => void }) {
  const avisar = usarAviso()
  return (
    <>
      <button type="button" onClick={() => avisar('Música removida', { desfazer })}>
        remover
      </button>
      <button type="button" onClick={() => avisar('Copiado')}>
        copiar
      </button>
    </>
  )
}

describe('Avisos', () => {
  it('mostra o aviso com Desfazer e some depois de 5 s', () => {
    const desfazer = vi.fn()
    render(
      <ProvedorDeAvisos>
        <Tela desfazer={desfazer} />
      </ProvedorDeAvisos>,
    )

    fireEvent.click(screen.getByText('remover'))
    expect(screen.getByRole('status').textContent).toContain('Música removida')
    expect(screen.getByRole('button', { name: 'Desfazer' })).not.toBeNull()

    act(() => vi.advanceTimersByTime(DURACAO_DO_AVISO + 300))
    expect(screen.queryByText('Música removida')).toBeNull()
    expect(desfazer).not.toHaveBeenCalled()
  })

  it('Desfazer chama a ação e fecha o aviso', () => {
    const desfazer = vi.fn()
    render(
      <ProvedorDeAvisos>
        <Tela desfazer={desfazer} />
      </ProvedorDeAvisos>,
    )

    fireEvent.click(screen.getByText('remover'))
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(desfazer).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(300))
    expect(screen.queryByText('Música removida')).toBeNull()
  })

  it('o aviso novo substitui o anterior', () => {
    render(
      <ProvedorDeAvisos>
        <Tela />
      </ProvedorDeAvisos>,
    )

    fireEvent.click(screen.getByText('remover'))
    fireEvent.click(screen.getByText('copiar'))
    expect(screen.queryByText('Música removida')).toBeNull()
    expect(screen.getByText('Copiado')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull()
  })
})
