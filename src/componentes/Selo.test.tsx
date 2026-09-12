import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Selo } from './Selo'

describe('Selo', () => {
  it('é neutro por padrão e aceita variante e ícone', () => {
    render(
      <>
        <Selo>nova</Selo>
        <Selo variante="tom">Tom G</Selo>
        <Selo variante="atencao" icone="atencao">
          repetida
        </Selo>
      </>,
    )

    expect(screen.getByText('nova').className).toBe('selo neutro')
    expect(screen.getByText('Tom G').className).toBe('selo tom')
    const comIcone = screen.getByText('repetida')
    expect(comIcone.className).toBe('selo atencao')
    expect(comIcone.querySelector('svg')).not.toBeNull()
  })
})
