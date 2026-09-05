import { describe, expect, it } from 'vitest'
import { ministerioDeExemplo } from './exemplo'
import { escalasNoAno, finsDeSemanaSeguidos, presencaDoMembro, ultimaEscala } from './presenca'
import type { Ministerio } from './tipos'

const cancelando = (m: Ministerio, id: string): Ministerio => ({
  ...m,
  escalas: m.escalas.map((e) => (e.id === id ? { ...e, cancelada: true } : e)),
})

const semEscala = (m: Ministerio, id: string): Ministerio => ({ ...m, escalas: m.escalas.filter((e) => e.id !== id) })

describe('escalasNoAno', () => {
  it('conta as Escalas Realizadas em que o Membro estava na Equipe, com qualquer Função', () => {
    const m = ministerioDeExemplo()

    expect(escalasNoAno(m, 'gabriel')).toBe(4)
    expect(escalasNoAno(m, 'isa')).toBe(2)
  })

  it('conta a Função técnica: quem serve no som esteve na Escala', () => {
    expect(escalasNoAno(ministerioDeExemplo(), 'davi')).toBe(4)
  })

  it('não conta Escala Agendada nem Cancelada', () => {
    const m = ministerioDeExemplo()

    expect(escalasNoAno(cancelando(m, 'e0816'), 'gabriel')).toBe(3)
    expect(escalasNoAno(m, 'gabriel', 2025)).toBe(0)
  })
})

describe('ultimaEscala', () => {
  it('devolve a Escala Realizada mais recente com o Membro na Equipe', () => {
    expect(ultimaEscala(ministerioDeExemplo(), 'gabriel')?.id).toBe('e0906')
    expect(ultimaEscala(ministerioDeExemplo(), 'isa')?.id).toBe('e0830')
  })

  it('devolve nulo pra quem nunca esteve numa Escala Realizada', () => {
    expect(ultimaEscala(ministerioDeExemplo(), 'rafa')?.id).toBe('e0823')
    expect(ultimaEscala({ ...ministerioDeExemplo(), escalas: [] }, 'gabriel')).toBeNull()
  })
})

describe('finsDeSemanaSeguidos', () => {
  it('conta os fins de semana seguidos em que o Membro esteve numa Escala Realizada', () => {
    expect(finsDeSemanaSeguidos(ministerioDeExemplo(), 'gabriel')).toBe(4)
  })

  it('quebra quando houve Escala Realizada no fim de semana e o Membro não estava em nenhuma', () => {
    expect(finsDeSemanaSeguidos(ministerioDeExemplo(), 'pedro')).toBe(1)
  })

  it('zera quando o Membro faltou no fim de semana mais recente com Escala', () => {
    expect(finsDeSemanaSeguidos(ministerioDeExemplo(), 'isa')).toBe(0)
  })

  it('trata fim de semana sem Escala como neutro: não sobe e não quebra', () => {
    expect(finsDeSemanaSeguidos(semEscala(ministerioDeExemplo(), 'e0823'), 'gabriel')).toBe(3)
  })

  it('trata fim de semana só com Cancelada como neutro', () => {
    expect(finsDeSemanaSeguidos(cancelando(ministerioDeExemplo(), 'e0906'), 'isa')).toBe(2)
  })

  it('conta sábado e domingo como o mesmo fim de semana', () => {
    const m = ministerioDeExemplo()
    const comSabado: Ministerio = {
      ...m,
      escalas: m.escalas.map((e) => (e.id === 'e0906' ? { ...e, data: '2026-09-05' } : e)),
    }

    expect(finsDeSemanaSeguidos(comSabado, 'gabriel')).toBe(4)
  })

  it('não deixa Escala de meio de semana quebrar a contagem', () => {
    const m = ministerioDeExemplo()
    const comQuarta: Ministerio = {
      ...m,
      escalas: m.escalas.map((e) => (e.id === 'e0906' ? { ...e, data: '2026-09-02', equipe: [] } : e)),
    }

    expect(finsDeSemanaSeguidos(comQuarta, 'gabriel')).toBe(3)
  })
})

describe('presencaDoMembro', () => {
  it('junta as três medidas do Perfil', () => {
    expect(presencaDoMembro(ministerioDeExemplo(), 'gabriel')).toEqual({
      escalasNoAno: 4,
      ultimaEscala: '2026-09-06',
      finsDeSemanaSeguidos: 4,
    })
  })
})
