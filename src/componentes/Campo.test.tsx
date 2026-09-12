import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Campo } from './Campo'

describe('Campo', () => {
  it('liga o rótulo ao controle e mostra a dica', () => {
    render(
      <Campo rotulo="Nome" dica="Como aparece na Escala">
        <input defaultValue="Ana" />
      </Campo>,
    )

    const campo = screen.getByLabelText(/Nome/) as HTMLInputElement
    expect(campo.value).toBe('Ana')
    expect(screen.getByText('Como aparece na Escala').className).toBe('dica')
  })

  it('troca a dica pelo erro quando há erro', () => {
    const { container } = render(
      <Campo rotulo="Link" dica="Cole o link" erro="Esse link não é do YouTube.">
        <input />
      </Campo>,
    )

    expect(screen.getByRole('alert').textContent).toBe('Esse link não é do YouTube.')
    expect(screen.queryByText('Cole o link')).toBeNull()
    expect(container.querySelector('.campo')?.className).toBe('campo com-erro')
  })
})
