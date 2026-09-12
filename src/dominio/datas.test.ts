import { describe, expect, it } from 'vitest'
import {
  diaDaSemana,
  domingoDaSantaCeia,
  domingosDoMes,
  fimDeSemanaDe,
  formatarDia,
  formatarDiaLongo,
  formatarDiaNumerico,
  hojeEmBrasilia,
  nomeDoDia,
  segundos,
  tempoRelativo,
} from './datas'

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

describe('formatarDiaNumerico e segundos', () => {
  it('formata a data como dia/mês', () => {
    expect(formatarDiaNumerico('2026-09-06')).toBe('06/09')
  })

  it('converte minutagem em segundos', () => {
    expect(segundos('2:10')).toBe(130)
    expect(segundos('')).toBe(0)
    expect(segundos('abc')).toBe(0)
  })
})

describe('formatarDia', () => {
  it('escreve dia da semana, dia e mês abreviados', () => {
    expect(formatarDia('2026-10-04', '2026-09-13')).toBe('dom, 4 de out')
    expect(formatarDia('2026-09-19', '2026-09-13')).toBe('sáb, 19 de set')
  })

  it('acrescenta o ano quando não é o ano de hoje', () => {
    expect(formatarDia('2025-10-04', '2026-09-13')).toBe('sáb, 4 de out de 2025')
  })

  it('usa a data de hoje quando ninguém passa', () => {
    const ano = hojeEmBrasilia().slice(0, 4)
    expect(formatarDia(`${ano}-01-01`)).not.toContain(ano)
    expect(formatarDia('1999-01-01')).toContain('de 1999')
  })
})

describe('formatarDiaLongo', () => {
  it('escreve por extenso', () => {
    expect(formatarDiaLongo('2026-10-04', '2026-09-13')).toBe('domingo, 4 de outubro')
    expect(formatarDiaLongo('2026-09-16', '2026-09-13')).toBe('quarta-feira, 16 de setembro')
  })

  it('acrescenta o ano quando não é o ano de hoje', () => {
    expect(formatarDiaLongo('2027-03-01', '2026-09-13')).toBe('segunda-feira, 1 de março de 2027')
  })
})

describe('tempoRelativo', () => {
  const hoje = '2026-09-13'

  it('hoje e ontem', () => {
    expect(tempoRelativo('2026-09-13', hoje)).toBe('hoje')
    expect(tempoRelativo('2026-09-12', hoje)).toBe('ontem')
  })

  it('dias até 13', () => {
    expect(tempoRelativo('2026-09-11', hoje)).toBe('há 2 dias')
    expect(tempoRelativo('2026-08-31', hoje)).toBe('há 13 dias')
  })

  it('semanas de 2 até 7', () => {
    expect(tempoRelativo('2026-08-30', hoje)).toBe('há 2 semanas')
    expect(tempoRelativo('2026-07-20', hoje)).toBe('há 7 semanas')
  })

  it('meses até 11', () => {
    expect(tempoRelativo('2026-07-19', hoje)).toBe('há 1 mês')
    expect(tempoRelativo('2026-07-13', hoje)).toBe('há 2 meses')
    expect(tempoRelativo('2025-10-13', hoje)).toBe('há 11 meses')
  })

  it('um ano, um ano e meses, anos', () => {
    expect(tempoRelativo('2025-09-13', hoje)).toBe('há 1 ano')
    expect(tempoRelativo('2025-08-13', hoje)).toBe('há 1 ano e 1 mês')
    expect(tempoRelativo('2025-07-01', hoje)).toBe('há 1 ano e 2 meses')
    expect(tempoRelativo('2024-09-13', hoje)).toBe('há 2 anos')
    expect(tempoRelativo('2020-01-01', hoje)).toBe('há 6 anos')
  })

  it('data no futuro conta como hoje', () => {
    expect(tempoRelativo('2026-09-20', hoje)).toBe('hoje')
  })
})

describe('domingoDaSantaCeia', () => {
  it('é o segundo domingo do mês', () => {
    expect(domingoDaSantaCeia(domingosDoMes(2026, 9))).toBe('2026-09-13')
    expect(domingoDaSantaCeia(domingosDoMes(2026, 8))).toBe('2026-08-09')
  })

  it('devolve nulo quando não há segundo domingo', () => {
    expect(domingoDaSantaCeia(['2026-09-06'])).toBeNull()
  })
})
