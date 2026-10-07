import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Esqueci } from './Esqueci'

function responder(status: number, corpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: status < 400, status, headers: new Headers(), json: async () => corpo })),
  )
}

function mostrar(endereco = '/esqueci') {
  render(
    <MemoryRouter initialEntries={[endereco]}>
      <Esqueci />
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('Esqueci', () => {
  it('com a lista ligada, mostra os nomes pra tocar', async () => {
    responder(200, { membros: [{ id: 'm1', nome: 'Isabela' }] })
    mostrar()

    expect(await screen.findByText('Isabela')).not.toBeNull()
    expect(screen.getByText('Quem é você?')).not.toBeNull()
  })

  it('com a lista desligada, só pede o link de convite', async () => {
    responder(403, { erro: 'recusado pelo Worker' })
    mostrar()

    expect(await screen.findByText('Peça seu link de convite a um ministro.')).not.toBeNull()
    expect(screen.queryByText('Quem é você?')).toBeNull()
    expect(screen.queryByText(/Toque no seu nome/)).toBeNull()
    expect(screen.queryByText('recusado pelo Worker')).toBeNull()
  })

  it('com a lista desligada e o convite vencido, diz que o link não vale mais', async () => {
    responder(403, { erro: 'recusado pelo Worker' })
    mostrar('/esqueci?convite=invalido')

    expect(await screen.findByText('Esse link de convite não vale mais. Peça um novo a um ministro.')).not.toBeNull()
  })

  it('sem conexão, mostra o erro em vez de dizer que a lista está desligada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    mostrar()

    expect(await screen.findByText('Sem conexão com o Renovo Music. Verifique a internet e tente de novo.')).not.toBeNull()
    expect(screen.queryByText(/Peça seu link de convite/)).toBeNull()
  })
})
