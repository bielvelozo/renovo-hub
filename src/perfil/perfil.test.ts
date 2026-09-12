import { describe, expect, it } from 'vitest'
import type { EscalaResumida } from '../api/tipos'
import { rotuloDeEscalasNoAno, rotuloDeSeguidos, textoDaUltimaEscala } from './perfil'

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
}

describe('números do Perfil', () => {
  it('o rótulo do número não repete o número, que já está no bloco', () => {
    expect(rotuloDeEscalasNoAno(0)).toBe('Escalas no ano')
    expect(rotuloDeEscalasNoAno(1)).toBe('Escala no ano')
    expect(rotuloDeEscalasNoAno(3)).toBe('Escalas no ano')
  })

  it('escreve a última Escala com título e dia', () => {
    expect(textoDaUltimaEscala(ULTIMA, '2026-09-13')).toBe('Culto de Domingo 18h · dom, 30 de ago')
  })

  it('quem nunca serviu não tem última Escala', () => {
    expect(textoDaUltimaEscala(null)).toBe('nenhuma ainda')
  })

  it('lido junto com o número, sai por extenso como o escala.md pede', () => {
    expect(rotuloDeSeguidos(0)).toBe('fins de semana seguidos')
    expect(rotuloDeSeguidos(1)).toBe('fim de semana seguido')
    expect(rotuloDeSeguidos(3)).toBe('fins de semana seguidos')
  })
})
