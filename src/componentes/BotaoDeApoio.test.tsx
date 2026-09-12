import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BotaoDeApoio } from './BotaoDeApoio'

describe('BotaoDeApoio', () => {
  it('mostra a contagem e chama aoTocar pra apoiar', () => {
    const aoTocar = vi.fn()
    render(<BotaoDeApoio apoios={3} apoiei={false} aoTocar={aoTocar} />)

    const botao = screen.getByRole('button', { name: 'Apoiar' })
    expect(botao.getAttribute('aria-pressed')).toBe('false')
    expect(botao.textContent).toBe('3')

    fireEvent.click(botao)
    expect(aoTocar).toHaveBeenCalledTimes(1)
  })

  it('quando já apoiei, o rótulo vira Desapoiar e o botão fica marcado', () => {
    render(<BotaoDeApoio apoios={4} apoiei desligado={false} aoTocar={vi.fn()} />)

    const botao = screen.getByRole('button', { name: 'Desapoiar' })
    expect(botao.getAttribute('aria-pressed')).toBe('true')
    expect(botao.className).toContain('apoiado')
  })

  it('desligado desabilita o toque', () => {
    render(<BotaoDeApoio apoios={0} apoiei={false} desligado aoTocar={vi.fn()} />)

    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })
})
