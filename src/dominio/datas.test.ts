import { describe, expect, it } from 'vitest'
import { diaDaSemana, domingosDoMes, fimDeSemanaDe, formatarDia, hojeEmBrasilia, nomeDoDia, segundos } from './datas'

describe('hojeEmBrasilia', () => {
  it('usa o fuso de Brasília, não o UTC', () => {
    expect(hojeEmBrasilia(new Date('2026-09-14T02:30:00Z'))).toBe('2026-09-13')
  })

  it('vira o dia à meia-noite de Brasília', () => {
    expect(hojeEmBrasilia(new Date('2026-09-14T02:59:59Z'))).toBe('2026-09-13')
    expect(hojeEmBrasilia(new Date('2026-09-14T03:00:00Z'))).toBe('2026-09-14')
  })
})

describe('diaDaSemana', () => {
  it('devolve 0 pra domingo e 6 pra sábado', () => {
    expect(diaDaSemana('2026-09-13')).toBe(0)
    expect(diaDaSemana('2026-09-12')).toBe(6)
  })

  it('não depende do fuso de quem roda', () => {
    expect(nomeDoDia('2026-09-13')).toBe('dom')
    expect(nomeDoDia('2026-09-16')).toBe('qua')
  })
})

describe('domingosDoMes', () => {
  it('devolve os domingos de um mês de quatro domingos', () => {
    expect(domingosDoMes(2026, 9)).toEqual(['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27'])
  })

  it('devolve os cinco domingos quando o mês tem cinco', () => {
    expect(domingosDoMes(2026, 8)).toEqual(['2026-08-02', '2026-08-09', '2026-08-16', '2026-08-23', '2026-08-30'])
  })
})

describe('fimDeSemanaDe', () => {
  it('agrupa sábado e domingo no mesmo fim de semana, identificado pelo domingo', () => {
    expect(fimDeSemanaDe('2026-09-12')).toBe('2026-09-13')
    expect(fimDeSemanaDe('2026-09-13')).toBe('2026-09-13')
  })

  it('devolve nulo pra data de meio de semana', () => {
    expect(fimDeSemanaDe('2026-09-16')).toBeNull()
  })
})

describe('formatarDia e segundos', () => {
  it('formata a data como dia/mês', () => {
    expect(formatarDia('2026-09-06')).toBe('06/09')
  })

  it('converte minutagem em segundos', () => {
    expect(segundos('2:10')).toBe(130)
    expect(segundos('')).toBe(0)
    expect(segundos('abc')).toBe(0)
  })
})
