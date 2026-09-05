import { describe, expect, it } from 'vitest'
import { contarFalhas, linhaDaConferencia, relatorio, resumoPorGrupo } from './relatorio'
import type { Conferencia } from './relatorio'

const passou = (grupo: string, nome: string): Conferencia => ({ grupo, nome, ok: true, detalhe: '' })
const falhou = (grupo: string, nome: string, detalhe: string): Conferencia => ({ grupo, nome, ok: false, detalhe })

describe('linhaDaConferencia', () => {
  it('marca o que passou com o nome e o detalhe medido', () => {
    expect(linhaDaConferencia({ grupo: '1 Mês', nome: 'lote cria 4 domingos', ok: true, detalhe: '4 criadas' })).toBe(
      '  ok      lote cria 4 domingos — 4 criadas',
    )
  })

  it('omite o travessão quando não há detalhe', () => {
    expect(linhaDaConferencia(passou('1 Mês', 'lote cria domingos'))).toBe('  ok      lote cria domingos')
  })

  it('marca a falha de forma que salta aos olhos', () => {
    expect(linhaDaConferencia(falhou('1 Mês', 'primeiro é Santa Ceia', 'veio 18:00'))).toBe(
      '  FALHOU  primeiro é Santa Ceia — veio 18:00',
    )
  })
})

describe('resumoPorGrupo', () => {
  it('preserva a ordem em que os grupos apareceram', () => {
    const resumo = resumoPorGrupo([
      passou('2 Link', 'a'),
      passou('1 Mês', 'b'),
      falhou('2 Link', 'c', 'x'),
      passou('2 Link', 'd'),
    ])

    expect(resumo).toEqual([
      { grupo: '2 Link', total: 3, falhas: 1 },
      { grupo: '1 Mês', total: 1, falhas: 0 },
    ])
  })

  it('devolve lista vazia sem conferências', () => {
    expect(resumoPorGrupo([])).toEqual([])
  })
})

describe('contarFalhas', () => {
  it('conta só o que não passou', () => {
    expect(contarFalhas([passou('a', 'x'), falhou('a', 'y', ''), falhou('b', 'z', '')])).toBe(2)
  })
})

describe('relatorio', () => {
  it('fecha com o veredito verde quando tudo passou', () => {
    const texto = relatorio([passou('1 Mês', 'lote cria domingos'), passou('1 Mês', 'primeiro é Santa Ceia')])

    expect(texto).toContain('1 Mês: 2 de 2')
    expect(texto).toContain('2 conferências, nenhuma falha.')
    expect(texto).not.toContain('FALHOU')
  })

  it('lista só as falhas no fim e diz quantas foram', () => {
    const texto = relatorio([
      passou('1 Mês', 'lote cria domingos'),
      falhou('2 Link', 'oEmbed devolve título', 'veio vazio'),
      falhou('2 Link', 'Item entra com Tom', 'sem tom'),
    ])

    expect(texto).toContain('2 Link: 0 de 2')
    expect(texto).toContain('Falhas:')
    expect(texto).toContain('  FALHOU  oEmbed devolve título — veio vazio')
    expect(texto).toContain('  FALHOU  Item entra com Tom — sem tom')
    expect(texto).toContain('3 conferências, 2 falhas.')
  })

  it('usa o singular quando é uma falha só', () => {
    expect(relatorio([falhou('1 Mês', 'x', 'y')])).toContain('1 conferência, 1 falha.')
  })

  it('avisa quando nada foi conferido, em vez de fingir sucesso', () => {
    expect(relatorio([])).toBe('Nenhuma conferência foi feita.')
  })
})
