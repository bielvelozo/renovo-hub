import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Letra } from '../dominio'
import { CorpoDaLetra } from './CorpoDaLetra'

const LETRA: Letra = {
  cabecalho: ['Rio – Renovo'],
  blocos: [
    { tipo: 'marcador', texto: '*Verso*' },
    {
      tipo: 'estrofe',
      linhas: [
        { texto: 'E me mostrou um rio', forte: false },
        { texto: 'Um rio de águas vivas', forte: false },
      ],
    },
    { tipo: 'marcador', texto: '*Refrão: 2 vezes*' },
    { tipo: 'estrofe', linhas: [{ texto: 'Ele é o Rei', forte: true }] },
  ],
}

describe('corpo da letra', () => {
  it('mostra marcadores, estrofes e a linha forte, sem o cabeçalho do Word', () => {
    const { container } = render(<CorpoDaLetra letra={LETRA} />)

    expect([...container.querySelectorAll('.marcador')].map((p) => p.textContent)).toEqual([
      '*Verso*',
      '*Refrão: 2 vezes*',
    ])
    expect(container.querySelector('p:not(.marcador)')?.innerHTML).toBe('E me mostrou um rio<br>Um rio de águas vivas')
    expect(container.querySelector('strong')?.textContent).toBe('Ele é o Rei')
    expect(container.textContent).not.toContain('Rio – Renovo')
  })

  it('aguenta letra sem bloco nenhum', () => {
    const { container } = render(<CorpoDaLetra letra={{ cabecalho: [], blocos: [] }} />)

    expect(container.querySelector('.letra')?.textContent).toBe('')
  })
})
