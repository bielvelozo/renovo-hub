import { describe, expect, it } from 'vitest'
import type { EscalaResumida } from '../api/tipos'
import { textoDaUltimaEscala, textoDasEscalasNoAno, textoDeSeguidos } from './perfil'

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
  it('conta as Escalas do ano por extenso', () => {
    expect(textoDasEscalasNoAno(0)).toBe('nenhuma ainda')
    expect(textoDasEscalasNoAno(1)).toBe('1 Escala')
    expect(textoDasEscalasNoAno(3)).toBe('3 Escalas')
  })

  it('escreve a última Escala com título e dia', () => {
    expect(textoDaUltimaEscala(ULTIMA)).toBe('Culto de Domingo 18h · 30/08 (dom)')
  })

  it('quem nunca serviu não tem última Escala', () => {
    expect(textoDaUltimaEscala(null)).toBe('nenhuma ainda')
  })

  it('usa o texto do domínio pros fins de semana seguidos', () => {
    expect(textoDeSeguidos(0)).toBe('nenhum ainda')
    expect(textoDeSeguidos(1)).toBe('1 fim de semana seguido')
    expect(textoDeSeguidos(3)).toBe('3 fins de semana seguidos')
  })
})
