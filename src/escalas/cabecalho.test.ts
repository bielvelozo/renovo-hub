import { describe, expect, it } from 'vitest'
import { subtituloDaEscala } from './cabecalho'

describe('subtituloDaEscala', () => {
  it('diz Hoje e Amanhã com o horário, e a data nos outros dias', () => {
    expect(subtituloDaEscala({ data: '2026-09-13', horario: '18:00' }, '2026-09-13')).toBe('Hoje, 18h')
    expect(subtituloDaEscala({ data: '2026-09-14', horario: '19:30' }, '2026-09-13')).toBe('Amanhã, 19:30')
    expect(subtituloDaEscala({ data: '2026-09-16', horario: '18:00' }, '2026-09-13')).toBe('qua, 16 de set · 18h')
  })

  it('no passado volta à data, sem Hoje', () => {
    expect(subtituloDaEscala({ data: '2026-09-06', horario: '18:00' }, '2026-09-13')).toBe('dom, 6 de set · 18h')
  })
})
