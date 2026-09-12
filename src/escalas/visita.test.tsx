import { beforeEach, describe, expect, it } from 'vitest'
import { chaveDaVisita, marcarVisitaNaEscala, mudouDesdeAVisita, visitaNaEscala } from './visita'

beforeEach(() => localStorage.clear())

describe('mudouDesdeAVisita', () => {
  it('marca o Item mudado quando a edição é posterior à visita', () => {
    expect(mudouDesdeAVisita('2026-09-12T10:00:00.000Z', '2026-09-12T09:00:00.000Z')).toBe(true)
    expect(mudouDesdeAVisita('2026-09-12T09:00:00.000Z', '2026-09-12T10:00:00.000Z')).toBe(false)
  })

  it('marca tudo que já foi editado pra quem nunca abriu a Escala', () => {
    expect(mudouDesdeAVisita('2026-09-12T10:00:00.000Z', null)).toBe(true)
  })

  it('não marca o Item antigo, sem data de edição', () => {
    expect(mudouDesdeAVisita(null, null)).toBe(false)
    expect(mudouDesdeAVisita(null, '2026-09-12T09:00:00.000Z')).toBe(false)
  })
})

describe('visita guardada no aparelho', () => {
  it('guarda uma chave por Escala', () => {
    expect(chaveDaVisita('e0913')).toBe('renovo:escala-vista:e0913')
  })

  it('só enxerga a visita depois de marcada', () => {
    expect(visitaNaEscala('e0913')).toBeNull()

    marcarVisitaNaEscala('e0913', new Date('2026-09-12T10:00:00.000Z'))

    expect(visitaNaEscala('e0913')).toBe('2026-09-12T10:00:00.000Z')
    expect(visitaNaEscala('e0920')).toBeNull()
  })
})
