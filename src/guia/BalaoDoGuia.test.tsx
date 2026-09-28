import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { comecarTarefa, sairDoGuia } from './andamento'
import { BalaoDoGuia } from './BalaoDoGuia'
import type { IdDaTarefa } from './tarefas'

const pedidos: string[] = []

beforeEach(() => {
  pedidos.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (endereco: string) => {
      pedidos.push(String(endereco))
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
    }),
  )
})

afterEach(() => {
  act(() => sairDoGuia())
  vi.unstubAllGlobals()
})

function mostrar(alvos: string[]) {
  render(
    <MemoryRouter>
      {alvos.map((alvo) => (
        <button key={alvo} type="button" data-guia={alvo}>
          {alvo}
        </button>
      ))}
      <BalaoDoGuia />
    </MemoryRouter>,
  )
}

async function comecar(tarefa: IdDaTarefa) {
  await act(async () => {
    await comecarTarefa(tarefa, () => {}, false)
  })
}

describe('BalaoDoGuia', () => {
  it('mostra o passo e avança com Próximo até concluir e marcar a tarefa', async () => {
    mostrar(['busca', 'abas-do-catalogo'])
    await comecar('catalogo')

    expect(screen.getByRole('dialog', { name: 'Guia: Achar músicas no catálogo' })).toBeTruthy()
    expect(screen.getByText('Passo 1 de 2')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByRole('heading', { name: 'Três jeitos de olhar' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(pedidos.some((pedido) => pedido.endsWith('/api/guia/feitas'))).toBe(true))
  })

  it('avança quando a pessoa toca no destaque', async () => {
    mostrar(['sugerir'])
    await comecar('sugerir')

    fireEvent.click(screen.getByRole('button', { name: 'sugerir' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ache a música' })).toBeTruthy())
  })

  it('pula o passo opcional quando o alvo não está na tela', async () => {
    mostrar(['nova-escala'])
    await comecar('criar-escalas')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Evento fora de domingo' })).toBeTruthy(), {
      timeout: 3000,
    })
  })

  it('explica e oferece sair quando falta o alvo de um passo obrigatório', async () => {
    mostrar([])
    await comecar('promover')

    await waitFor(() => expect(screen.getByText(/Não tem sugestão aberta agora/)).toBeTruthy(), { timeout: 3000 })

    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sai do guia pelo X', async () => {
    mostrar(['busca'])
    await comecar('catalogo')

    fireEvent.click(screen.getByRole('button', { name: 'Sair do guia' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
