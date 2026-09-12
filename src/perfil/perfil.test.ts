import { describe, expect, it } from 'vitest'
import type { EscalaResumida } from '../api/tipos'
import {
  inicialDoNome,
  rotuloDeEscalasEmAno,
  rotuloDeServidos,
  textoDaProximaEscala,
  textoDaUltimaEscala,
  textoDeServidos,
} from './perfil'

const ULTIMA: EscalaResumida = {
  id: 'e0830',
  data: '2026-08-30',
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  estado: 'realizada',
  titulo: 'Culto de Domingo 18h',
  ministros: ['Isa'],
  membros: ['gabriel'],
  quantidadeNaEquipe: 6,
  quantidadeDeItens: 4,
  pendencias: [],
  pronta: true,
  porGrupo: [],
  minhasFuncoes: [],
}

describe('números do Perfil', () => {
  it('escalas no ano dizem o ano e concordam em número', () => {
    expect(rotuloDeEscalasEmAno(0, '2026')).toBe('escalas em 2026')
    expect(rotuloDeEscalasEmAno(1, '2026')).toBe('escala em 2026')
    expect(rotuloDeEscalasEmAno(4, '2026')).toBe('escalas em 2026')
  })

  it('fins de semana servidos saem como «N de M» e o rótulo concorda com M', () => {
    expect(textoDeServidos(4, 6)).toBe('4 de 6')
    expect(textoDeServidos(0, 0)).toBe('0 de 0')
    expect(rotuloDeServidos(6)).toBe('fins de semana servidos')
    expect(rotuloDeServidos(1)).toBe('fim de semana servido')
  })
})

describe('próxima e última escala', () => {
  it('a próxima escala diz o dia e as funções em minúscula', () => {
    expect(
      textoDaProximaEscala({ id: 'e0920', data: '2026-09-20', titulo: 'Culto de Domingo 18h', funcoes: ['Vocal', 'Violão'] }, '2026-09-13'),
    ).toBe('dom, 20 de set · vocal, violão')
    expect(textoDaProximaEscala({ id: 'e0920', data: '2026-09-20', titulo: 'Culto', funcoes: [] }, '2026-09-13')).toBe('dom, 20 de set')
  })

  it('quem não está em nenhuma escala agendada lê isso com todas as letras', () => {
    expect(textoDaProximaEscala(null)).toBe('você não está em nenhuma escala agendada')
  })

  it('a última escala sai só com o dia curto', () => {
    expect(textoDaUltimaEscala(ULTIMA, '2026-09-13')).toBe('dom, 30 de ago')
    expect(textoDaUltimaEscala(null)).toBe('nenhuma ainda')
  })
})

describe('inicialDoNome', () => {
  it('pega a primeira letra em maiúscula, com acento', () => {
    expect(inicialDoNome('gabriel')).toBe('G')
    expect(inicialDoNome('Érica')).toBe('É')
    expect(inicialDoNome('  ')).toBe('?')
  })
})
