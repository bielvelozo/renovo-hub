import { describe, expect, it } from 'vitest'
import { resumoDoRepertorio } from './execucoes'
import { inteira, medley, ministerioDeExemplo } from './exemplo'
import type { Escala } from './tipos'

function repertorio(itens: Escala['itens']): Escala {
  return {
    id: 'prova',
    data: '2030-01-06',
    horario: '18:00',
    rotulo: 'Culto de Domingo',
    santaCeia: false,
    cancelada: false,
    equipe: [],
    itens,
  }
}

const ITENS = [
  inteira('a', 'meia-noite', 'G'),
  inteira('b', 'firme', 'C'),
  inteira('c', 'rio', 'D'),
  medley('d', [
    { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '2:30' },
    { musicaId: 'dono', tom: 'E', inicio: '1:12', fim: '3:05' },
  ]),
]

describe('resumo do Repertório', () => {
  it('conta uma categoria por Item e o Medley pelos Trechos', () => {
    const m = ministerioDeExemplo('2026-09-08')

    expect(resumoDoRepertorio(m, repertorio(ITENS), 2)).toEqual({
      recentes: 1,
      antigas: 0,
      nuncaTocadas: 3,
      total: 5,
    })
  })

  it('chama de antiga a Música parada há seis meses ou mais', () => {
    const m = ministerioDeExemplo('2027-04-08')

    expect(resumoDoRepertorio(m, repertorio(ITENS), 4)).toEqual({
      recentes: 0,
      antigas: 2,
      nuncaTocadas: 3,
      total: 5,
    })
  })

  it('devolve tudo zerado sem Itens', () => {
    const m = ministerioDeExemplo('2026-09-08')

    expect(resumoDoRepertorio(m, repertorio([]), 4)).toEqual({ recentes: 0, antigas: 0, nuncaTocadas: 0, total: 0 })
  })
})
