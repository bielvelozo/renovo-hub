import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Botao, BotaoLink } from './Botao'

describe('Botao', () => {
  it('é primário por padrão e gera as classes das variantes', () => {
    render(
      <>
        <Botao>Salvar</Botao>
        <Botao variante="secundario" pequeno>
          Cancelar
        </Botao>
        <Botao variante="terciario" className="perigo" largo>
          Sair
        </Botao>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Salvar' }).className).toBe('botao')
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toBe('botao secundario pequeno')
    expect(screen.getByRole('button', { name: 'Sair' }).className).toBe('botao terciario largo perigo')
  })

  it('carregando desliga o botão e mantém o texto no lugar, escondido', () => {
    render(<Botao carregando>Enviar</Botao>)

    const botao = screen.getByRole('button') as HTMLButtonElement
    expect(botao.disabled).toBe(true)
    expect(botao.getAttribute('aria-busy')).toBe('true')
    expect(botao.className).toContain('carregando')
    expect(botao.querySelector('.conteudo-do-botao')?.textContent).toBe('Enviar')
    expect(botao.querySelector('.girando-no-botao')).not.toBeNull()
  })

  it('variante ícone desenha o ícone e aceita rótulo acessível', () => {
    render(<Botao variante="icone" icone="remover" aria-label="Tirar" />)

    const botao = screen.getByRole('button', { name: 'Tirar' })
    expect(botao.className).toBe('botao icone')
    expect(botao.querySelector('svg.icone')).not.toBeNull()
  })

  it('BotaoLink vira um link com as mesmas classes', () => {
    render(
      <MemoryRouter>
        <BotaoLink para="/musicas" variante="secundario">
          Ver músicas
        </BotaoLink>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Ver músicas' })
    expect(link.getAttribute('href')).toBe('/musicas')
    expect(link.className).toBe('botao secundario')
  })
})
