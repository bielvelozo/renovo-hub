import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErroDeCarga } from './ErroDeCarga'

describe('ErroDeCarga', () => {
  it('anuncia a mensagem e oferece tentar de novo na própria tela', () => {
    const tentarDeNovo = vi.fn()
    render(<ErroDeCarga mensagem="Sem conexão. Tente de novo." tentarDeNovo={tentarDeNovo} />)

    expect(screen.getByRole('alert').textContent).toBe('Sem conexão. Tente de novo.')

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(tentarDeNovo).toHaveBeenCalledTimes(1)
  })
})
