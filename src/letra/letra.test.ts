import { describe, expect, it } from 'vitest'
import type { Letra } from '../dominio'
import { contarLinhas, juntarLetras } from './letra'

const rio: Letra = {
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
  ],
}

const sublime: Letra = {
  cabecalho: [],
  blocos: [{ tipo: 'estrofe', linhas: [{ texto: 'Quem é como Tu?', forte: true }] }],
}

describe('contarLinhas', () => {
  it('conta marcadores e linhas de estrofe', () => {
    expect(contarLinhas(rio)).toBe(3)
    expect(contarLinhas(sublime)).toBe(1)
    expect(contarLinhas({ cabecalho: [], blocos: [] })).toBe(0)
  })
})

describe('juntarLetras', () => {
  it('põe o título antes de cada letra e pula quem não tem', () => {
    const junta = juntarLetras([
      { titulo: 'Rio', letra: rio },
      { titulo: 'Sem letra', letra: null },
      { titulo: 'Sublime', letra: sublime },
    ])

    expect(junta?.blocos).toEqual([
      { tipo: 'marcador', texto: 'Rio' },
      ...rio.blocos,
      { tipo: 'marcador', texto: 'Sublime' },
      ...sublime.blocos,
    ])
    expect(junta?.cabecalho).toEqual([])
  })

  it('devolve nulo quando ninguém tem letra', () => {
    expect(juntarLetras([{ titulo: 'Rio', letra: null }])).toBeNull()
  })
})
