import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Segmento } from './Segmento'

const OPCOES = [
  { valor: 'inteira', rotulo: 'Inteira' },
  { valor: 'trecho', rotulo: 'Trecho' },
] as const

describe('Segmento', () => {
  it('marca a opção atual e move o marcador pela posição', () => {
    const { container } = render(<Segmento rotulo="Modo" opcoes={[...OPCOES]} valor="trecho" aoMudar={() => {}} />)

    expect(screen.getByRole('button', { name: 'Trecho' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Inteira' }).getAttribute('aria-pressed')).toBe('false')
    const grupo = container.querySelector('.segmento') as HTMLElement
    expect(grupo.style.getPropertyValue('--posicao')).toBe('1')
    expect(grupo.style.getPropertyValue('--total')).toBe('2')
    expect(grupo.getAttribute('aria-label')).toBe('Modo')
  })

  it('avisa a opção escolhida ao tocar', () => {
    const aoMudar = vi.fn()
    render(<Segmento rotulo="Modo" opcoes={[...OPCOES]} valor="inteira" aoMudar={aoMudar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Trecho' }))
    expect(aoMudar).toHaveBeenCalledWith('trecho')
  })
})
