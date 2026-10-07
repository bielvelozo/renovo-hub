import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ouvirInstalacao } from '../instalacao/prompt'
import { Instalar } from './Instalar'

vi.mock('../sessao/sessao', () => ({
  usarSessao: () => ({
    situacao: 'dentro',
    eu: { id: 'm1', nome: 'Gabriel', funcoes: [], ministro: false, admin: false, inativo: false, silenciado: false },
    recarregar: () => {},
  }),
}))

vi.mock('../api/usarBusca', () => ({
  usarBusca: () => ({ dados: null, erro: null, carregando: false, vistoEm: null, recarregar: () => {}, definir: () => {} }),
}))

vi.mock('../componentes/NotificacoesCompactas', () => ({
  NotificacoesCompactas: () => <li>Notificações</li>,
}))

let navegador: EventTarget

function navegadorPermiteInstalar(escolha: 'accepted' | 'dismissed') {
  const prompt = vi.fn(async () => {})
  const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: escolha }),
  })
  act(() => {
    navegador.dispatchEvent(evento)
  })
  return prompt
}

const mostrar = () =>
  render(
    <MemoryRouter>
      <Instalar />
    </MemoryRouter>,
  )

describe('Instalar', () => {
  beforeEach(() => {
    navegador = new EventTarget()
    ouvirInstalacao(navegador)
  })

  it('cumprimenta pelo nome', () => {
    mostrar()

    expect(screen.getByRole('heading', { level: 1, name: 'Oi, Gabriel' })).toBeTruthy()
  })

  it('abre o diálogo do navegador num toque quando ele permite instalar', async () => {
    mostrar()
    const prompt = navegadorPermiteInstalar('accepted')

    fireEvent.click(screen.getByRole('button', { name: 'Instalar na tela inicial' }))

    expect(prompt).toHaveBeenCalledOnce()
    expect(await screen.findByText(/Abra o Renovo Music pelo ícone da tela inicial/)).toBeTruthy()
  })

  it('mostra os passos à mão quando o navegador não permite instalar num toque', async () => {
    mostrar()

    fireEvent.click(screen.getByRole('button', { name: 'Instalar na tela inicial' }))

    expect(await screen.findByRole('group', { name: 'Onde você está' })).toBeTruthy()
  })

  it('mostra os passos à mão no toque seguinte a quem recusou o diálogo', async () => {
    mostrar()
    const prompt = navegadorPermiteInstalar('dismissed')
    const instalar = () => screen.getByRole('button', { name: 'Instalar na tela inicial' })

    fireEvent.click(instalar())
    await act(async () => {})

    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('group', { name: 'Onde você está' })).toBeNull()

    fireEvent.click(instalar())

    expect(await screen.findByRole('group', { name: 'Onde você está' })).toBeTruthy()
  })

  it('deixa seguir no navegador sem instalar', () => {
    mostrar()

    expect(screen.getByRole('link', { name: 'Agora não, usar no navegador' }).getAttribute('href')).toBe('/')
  })
})
