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
    { tipo: 'marcador', texto: '//' },
  ],
}

describe('corpo da letra', () => {
  it('mostra marcadores sem os símbolos do Word, estrofes e a linha forte, sem o cabeçalho', () => {
    const { container } = render(<CorpoDaLetra letra={LETRA} />)

    expect([...container.querySelectorAll('.marcador')].map((p) => p.textContent)).toEqual(['Verso', 'Refrão: 2 vezes'])
    expect(container.querySelector('strong')?.textContent).toBe('Ele é o Rei')
    expect(container.textContent).not.toContain('Rio – Renovo')
  })

  it('cada verso é um bloco próprio, sem quebra de linha manual', () => {
    const { container } = render(<CorpoDaLetra letra={LETRA} />)
    const [primeira, refrao] = container.querySelectorAll('p:not(.marcador)')

    expect([...primeira.querySelectorAll('.verso')].map((verso) => verso.textContent)).toEqual([
      'E me mostrou um rio',
      'Um rio de águas vivas',
    ])
    expect(primeira.querySelector('br')).toBeNull()
    expect(refrao.querySelector('.verso > strong')?.textContent).toBe('Ele é o Rei')
  })

  it('aguenta letra sem bloco nenhum', () => {
    const { container } = render(<CorpoDaLetra letra={{ cabecalho: [], blocos: [] }} />)

    expect(container.querySelector('.letra')?.textContent).toBe('')
  })
})
