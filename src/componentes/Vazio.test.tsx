import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Botao } from './Botao'
import { Vazio } from './Vazio'

describe('Vazio', () => {
  it('mostra ícone, frase e o botão opcional', () => {
    const { container } = render(
      <Vazio icone="musica" acao={<Botao variante="secundario">Buscar no YouTube</Botao>}>
        Nenhuma música com esse nome. Cole um link ou busque no YouTube.
      </Vazio>,
    )

    expect(container.querySelector('.vazio > svg.icone')).not.toBeNull()
    expect(screen.getByText(/Nenhuma música com esse nome/)).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Buscar no YouTube' })).not.toBeNull()
  })
})
