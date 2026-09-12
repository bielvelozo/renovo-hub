import { describe, expect, it } from 'vitest'
import { deslocarMes, domingosQueFaltam, mesDaData, nomeDoMes, rotuloDoMes } from './mes'

describe('mes', () => {
  it('tira o mês da data', () => {
    expect(mesDaData('2026-09-13')).toBe('2026-09')
  })

  it('anda pra frente e pra trás dentro do ano', () => {
    expect(deslocarMes('2026-09', 1)).toBe('2026-10')
    expect(deslocarMes('2026-09', -1)).toBe('2026-08')
  })

  it('vira o ano nos dois sentidos', () => {
    expect(deslocarMes('2026-12', 1)).toBe('2027-01')
    expect(deslocarMes('2026-01', -1)).toBe('2025-12')
  })

  it('anda vários meses de uma vez', () => {
    expect(deslocarMes('2026-01', 13)).toBe('2027-02')
  })

  it('escreve o mês por extenso com o ano', () => {
    expect(rotuloDoMes('2026-09')).toBe('Setembro 2026')
    expect(nomeDoMes('2026-03')).toBe('Março')
  })

  it('lista os domingos do mês que ainda não têm Escala', () => {
    expect(domingosQueFaltam('2026-09', ['2026-09-13'])).toEqual(['2026-09-06', '2026-09-20', '2026-09-27'])
  })

  it('não conta datas de outros meses como já criadas', () => {
    expect(domingosQueFaltam('2026-09', ['2026-08-30'])).toHaveLength(4)
  })

  it('devolve lista vazia quando o mês inteiro já existe', () => {
    const todos = ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27']
    expect(domingosQueFaltam('2026-09', todos)).toEqual([])
  })

})
