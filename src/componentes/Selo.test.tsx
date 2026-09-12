import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Selo } from './Selo'
import { Selos } from './Selos'

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

describe('Selos da Escala', () => {
  it('não renderiza nada pra Escala agendada sem Santa Ceia', () => {
    const { container } = render(<Selos estado="agendada" santaCeia={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('mostra só a Santa Ceia quando a Escala está agendada', () => {
    render(<Selos estado="agendada" santaCeia />)
    expect(screen.getByText('Santa Ceia').className).toBe('selo ceia')
    expect(screen.queryByText('agendada')).toBeNull()
  })

  it('mostra realizada e cancelada como exceção', () => {
    render(
      <>
        <Selos estado="realizada" santaCeia={false} />
        <Selos estado="cancelada" santaCeia />
      </>,
    )
    expect(screen.getByText('realizada').className).toBe('selo realizada')
    expect(screen.getByText('cancelada').className).toBe('selo cancelada')
    expect(screen.getByText('Santa Ceia')).not.toBeNull()
  })
})
