import { describe, expect, it } from 'vitest'
import { ministerioDeExemplo } from './exemplo'
import { pendenciasDaEscala, resumoPorGrupo } from './pendencias'
import type { Escala, Ministerio } from './tipos'

const HOJE = '2026-09-08'

function comEscala(equipe: Escala['equipe'], extra: Partial<Escala> = {}): { m: Ministerio; escala: Escala } {
  const m = ministerioDeExemplo(HOJE)
  const escala: Escala = {
    id: 'nova',
    data: '2026-09-20',
    horario: '18:00',
    rotulo: 'Culto de Domingo',
    santaCeia: false,
    cancelada: false,
    equipe,
    itens: [m.escalas[0].itens[0]],
    ...extra,
  }

  return { m: { ...m, escalas: [...m.escalas, escala] }, escala }
}

const COMPLETA: Escala['equipe'] = [
  { membroId: 'isa', funcoes: ['vocal'], ministro: true },
  { membroId: 'ana', funcoes: ['vocal'], ministro: false },
  { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
  { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
  { membroId: 'lucas', funcoes: ['bateria'], ministro: false },
  { membroId: 'davi', funcoes: ['som'], ministro: false },
]

describe('pendências da Escala', () => {
  it('não acha nada numa Escala com Equipe completa e Repertório', () => {
    const { m, escala } = comEscala(COMPLETA)
    const resultado = pendenciasDaEscala(m, escala)

    expect(resultado.pendencias).toEqual([])
    expect(resultado.pronta).toBe(true)
  })

  it('cobra o Ministro quando ninguém tem a marca', () => {
    const { m, escala } = comEscala(COMPLETA.map((entrada) => ({ ...entrada, ministro: false })))
    const resultado = pendenciasDaEscala(m, escala)

    expect(resultado.pendencias[0]).toEqual({ chave: 'sem-ministro', texto: 'sem ministro' })
    expect(resultado.pronta).toBe(false)
  })

  it('cobra o mínimo da Função no singular e no plural', () => {
    const { m, escala } = comEscala(COMPLETA.filter((entrada) => entrada.membroId !== 'lucas'))

    expect(pendenciasDaEscala(m, escala).pendencias).toEqual([
      { chave: 'falta-funcao', texto: 'falta 1 bateria', funcaoId: 'bateria' },
    ])

    const semVocal = comEscala(COMPLETA.filter((entrada) => !['isa', 'ana'].includes(entrada.membroId)))
    const textos = pendenciasDaEscala(semVocal.m, semVocal.escala).pendencias.map((p) => p.texto)

    expect(textos).toContain('faltam 2 vocais')
  })

  it('conta uma vez em cada Função quem tem duas', () => {
    const { m, escala } = comEscala([
      { membroId: 'isa', funcoes: ['vocal'], ministro: true },
      { membroId: 'julia', funcoes: ['vocal', 'teclado'], ministro: false },
      { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
      { membroId: 'rafa', funcoes: ['baixo', 'teclado'], ministro: false },
      { membroId: 'lucas', funcoes: ['bateria'], ministro: false },
      { membroId: 'davi', funcoes: ['som'], ministro: false },
    ])

    expect(pendenciasDaEscala(m, escala).pendencias).toEqual([])
  })

  it('cobra o Repertório vazio', () => {
    const { m, escala } = comEscala(COMPLETA, { itens: [] })

    expect(pendenciasDaEscala(m, escala).pendencias).toEqual([{ chave: 'sem-musicas', texto: 'sem músicas' }])
  })

  it('não cobra nada de Escala Realizada nem de Cancelada', () => {
    const realizada = comEscala([], { data: '2026-08-02', itens: [] })
    const cancelada = comEscala([], { cancelada: true, itens: [] })

    expect(pendenciasDaEscala(realizada.m, realizada.escala)).toMatchObject({ pendencias: [], pronta: true })
    expect(pendenciasDaEscala(cancelada.m, cancelada.escala)).toMatchObject({ pendencias: [], pronta: true })
  })
})

describe('resumo por Grupo', () => {
  it('conta pessoas distintas, soma os mínimos e diz o que falta', () => {
    const { m, escala } = comEscala(COMPLETA.filter((entrada) => entrada.membroId !== 'lucas'))

    expect(resumoPorGrupo(m, escala)).toEqual([
      { grupo: 'vocal', escalados: 2, minimo: 2, faltam: [], texto: 'vocal 2 de 2' },
      {
        grupo: 'instrumentos',
        escalados: 2,
        minimo: 3,
        faltam: ['bateria'],
        texto: 'músicos 2 de 3 · falta bateria',
      },
      { grupo: 'tecnica', escalados: 1, minimo: 1, faltam: [], texto: 'som 1 de 1' },
    ])
  })

  it('escreve só a contagem quando o Grupo não tem mínimo', () => {
    const m = ministerioDeExemplo(HOJE)
    const semMinimo = { ...m, funcoes: m.funcoes.map((funcao) => ({ ...funcao, minimo: 0 })) }
    const escala = { ...m.escalas[0], equipe: [], itens: [] }

    expect(resumoPorGrupo(semMinimo, escala).map((linha) => linha.texto)).toEqual(['vocal 0', 'músicos 0', 'som 0'])
  })

  it('sai também para Escala Realizada, que não tem pendência', () => {
    const { m, escala } = comEscala(COMPLETA, { data: '2026-08-02' })
    const resultado = pendenciasDaEscala(m, escala)

    expect(resultado.porGrupo.map((linha) => linha.texto)).toEqual(['vocal 2 de 2', 'músicos 3 de 3', 'som 1 de 1'])
  })
})
