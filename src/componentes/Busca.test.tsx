import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Busca } from './Busca'

describe('Busca', () => {
  it('é um campo de busca com lupa e sem botão de limpar quando vazio', () => {
    const { container } = render(<Busca valor="" aoMudar={() => {}} />)

    const campo = screen.getByRole('searchbox', { name: 'Buscar' })
    expect(campo.getAttribute('type')).toBe('search')
    expect(container.querySelectorAll('svg.icone').length).toBe(1)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('avisa o que foi digitado e limpa pelo botão', () => {
    const aoMudar = vi.fn()
    render(<Busca valor="meia" aoMudar={aoMudar} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'meia n' } })
    expect(aoMudar).toHaveBeenLastCalledWith('meia n')

    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))
    expect(aoMudar).toHaveBeenLastCalledWith('')
  })
})
