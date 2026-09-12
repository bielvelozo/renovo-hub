import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GradeDeMeses } from './SeletorDeMes'

describe('GradeDeMeses', () => {
  it('abre no ano do mês visto e marca o mês escolhido', () => {
    render(<GradeDeMeses mes="2026-09" hoje="2026-09-13" aoEscolher={vi.fn()} />)

    expect(screen.getByText('2026')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Setembro' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Outubro' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('anda de ano sem escolher e entrega o mês tocado', () => {
    const aoEscolher = vi.fn()
    render(<GradeDeMeses mes="2026-09" hoje="2026-09-13" aoEscolher={aoEscolher} />)

    fireEvent.click(screen.getByLabelText('Próximo ano'))
    expect(screen.getByText('2027')).not.toBeNull()
    expect(aoEscolher).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Março' }))
    expect(aoEscolher).toHaveBeenCalledWith('2027-03')
  })

  it('volta para hoje de qualquer ano', () => {
    const aoEscolher = vi.fn()
    render(<GradeDeMeses mes="2026-09" hoje="2026-09-13" aoEscolher={aoEscolher} />)

    fireEvent.click(screen.getByLabelText('Ano anterior'))
    fireEvent.click(screen.getByLabelText('Ano anterior'))
    expect(screen.getByText('2024')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(aoEscolher).toHaveBeenCalledWith('2026-09')
  })
})
