import { describe, expect, it } from 'vitest'
import type { Letra } from '../dominio'
import { juntarLetras, textoDoMarcador } from './letra'

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

describe('textoDoMarcador', () => {
  it('tira as barras e os asteriscos que o Word usa para marcar a seção', () => {
    expect(textoDoMarcador('//VERSO-1')).toBe('VERSO-1')
    expect(textoDoMarcador('// INTRO')).toBe('INTRO')
    expect(textoDoMarcador('*Refrão: 2 vezes*')).toBe('Refrão: 2 vezes')
    expect(textoDoMarcador('*Final')).toBe('Final')
    expect(textoDoMarcador('Ponte')).toBe('Ponte')
    expect(textoDoMarcador('//')).toBe('')
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
