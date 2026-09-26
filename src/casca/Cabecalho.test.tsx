import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Cabecalho } from './Cabecalho'

describe('Cabecalho', () => {
  it('no modo raiz mostra o selo, a ação e o título em display abaixo da faixa', () => {
    const { container } = render(
      <MemoryRouter>
        <Cabecalho raiz titulo="Oi, Gabriel" acao={<button type="button">engrenagem</button>} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Início' }).querySelector('svg.selo-da-marca')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).className).toBe('titulo-de-tela display')
    expect(container.querySelector('.faixa.raiz .titulo-encolhido')?.textContent).toBe('Oi, Gabriel')
    expect(container.querySelector('.faixa.raiz')?.className).not.toContain('com-titulo')
    expect(screen.getByRole('button', { name: 'engrenagem' })).not.toBeNull()
  })

  it('no modo raiz a legenda fica no bloco do título, logo abaixo do h1', () => {
    const { container } = render(
      <MemoryRouter>
        <Cabecalho raiz titulo="Oi, Gabriel" legenda={<p className="dica visto-em">visto às 10:32</p>} />
      </MemoryRouter>,
    )

    const bloco = container.querySelector('.bloco-do-titulo')!
    expect(bloco.querySelector('h1')?.textContent).toBe('Oi, Gabriel')
    expect(bloco.lastElementChild?.textContent).toBe('visto às 10:32')
  })

  it('no modo raiz troca o título por um rico e põe a navegação ao lado', () => {
    const { container } = render(
      <MemoryRouter>
        <Cabecalho
          raiz
          titulo="Setembro 2026"
          tituloRico={<button type="button">Setembro</button>}
          navegacao={<button type="button">Próximo mês</button>}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Setembro')
    expect(container.querySelector('.faixa.raiz .titulo-encolhido')?.textContent).toBe('Setembro 2026')
    expect(container.querySelector('.linha-do-titulo .navegacao-do-titulo')?.textContent).toBe('Próximo mês')
  })

  it('na subtela volta pelo link ou pela ação', () => {
    const aoVoltar = vi.fn()
    render(
      <MemoryRouter>
        <Cabecalho titulo="Equipe" sub="dom, 13 de set" voltarPara="/escalas/e1" />
        <Cabecalho titulo="Adicionar" aoVoltar={aoVoltar} />
      </MemoryRouter>,
    )

    const [link, botao] = screen.getAllByLabelText('Voltar')
    expect(link.getAttribute('href')).toBe('/escalas/e1')
    expect(screen.getByText('dom, 13 de set').className).toBe('dica')

    fireEvent.click(botao)
    expect(aoVoltar).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.className)).toEqual([
      'titulo-da-subtela',
      'titulo-da-subtela',
    ])
  })
})
