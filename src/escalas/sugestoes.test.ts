import { describe, expect, it } from 'vitest'
import { diaDaSugestao, textoDosApoios } from './sugestoes'

describe('sugestoes', () => {
  it('mostra só o dia do carimbo de tempo que o banco guarda', () => {
    expect(diaDaSugestao('2026-09-05T03:12:44.000Z')).toBe('05/09')
  })

  it('conjuga apoia e apoiam, e diz quando ninguém apoiou', () => {
    expect(textoDosApoios([])).toBe('ninguém apoiou ainda')
    expect(textoDosApoios([{ id: 'isa', nome: 'Isa' }])).toBe('Isa apoia')
    expect(
      textoDosApoios([
        { id: 'isa', nome: 'Isa' },
        { id: 'julia', nome: 'Júlia' },
      ]),
    ).toBe('Isa, Júlia apoiam')
  })
})
