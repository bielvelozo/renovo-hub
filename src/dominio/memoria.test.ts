import { describe, expect, it } from 'vitest'
import { musicaPorId } from './escala'
import { inteira, medley, ministerioDeExemplo } from './exemplo'
import {
  abaDaMusica,
  coberturaDoMinisterio,
  memoriaDaMusica,
  planejadaEm,
  recente,
  secaoDaMusica,
  vezesTocadaDesde,
} from './memoria'
import type { Ministerio } from './tipos'

const comEscala = (
  m: Ministerio,
  id: string,
  muda: (e: Ministerio['escalas'][number]) => Ministerio['escalas'][number],
): Ministerio => ({ ...m, escalas: m.escalas.map((e) => (e.id === id ? muda(e) : e)) })

describe('recente', () => {
  it('é recente quando a última Execução está a menos de semanas × 7 dias', () => {
    const m = ministerioDeExemplo('2026-09-08')

    expect(recente(m, 'fez-um-caminho', 4)).toBe(true)
    expect(recente(m, 'firme', 2)).toBe(false)
  })

  it('exatamente semanas × 7 dias não é recente; um dia a menos é', () => {
    expect(recente(ministerioDeExemplo('2026-09-13'), 'meia-noite', 2)).toBe(false)
    expect(recente(ministerioDeExemplo('2026-09-12'), 'meia-noite', 2)).toBe(true)
  })

  it('conta Execução parcial e nunca é recente sem Execução', () => {
    const m = ministerioDeExemplo('2026-09-08')

    expect(recente(m, 'sublime', 4)).toBe(true)
    expect(recente(m, 'rio', 52)).toBe(false)
  })
})

describe('planejadaEm', () => {
  const m = comEscala(ministerioDeExemplo(), 'e0920', (e) => ({
    ...e,
    equipe: [{ membroId: 'marcos', funcoes: ['vocal'], ministro: true }],
    itens: [
      inteira('p1', 'grato', 'Bb'),
      medley('p2', [
        { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '1:00' },
        { musicaId: 'dono', tom: 'E', inicio: '0:00', fim: '1:00' },
      ]),
    ],
  }))

  it('lista as Escalas agendadas com a Música, com data, título e Ministros, por data', () => {
    const comDuas = comEscala(m, 'e0927', (e) => ({ ...e, itens: [inteira('p3', 'grato', 'C')] }))

    expect(planejadaEm(comDuas, 'grato')).toEqual([
      { escalaId: 'e0920', data: '2026-09-20', titulo: 'Culto de Domingo 18h', ministros: ['Marcos'] },
      { escalaId: 'e0927', data: '2026-09-27', titulo: 'Culto de Domingo 18h', ministros: [] },
    ])
  })

  it('exclui a Escala atual quando informada', () => {
    expect(planejadaEm(m, 'grato', 'e0920')).toEqual([])
  })

  it('inclui a Música que está dentro de um Medley', () => {
    expect(planejadaEm(m, 'dono').map((x) => x.escalaId)).toEqual(['e0920'])
  })

  it('ignora Escalas Realizadas e Canceladas', () => {
    const cancelada = comEscala(m, 'e0920', (e) => ({ ...e, cancelada: true }))

    expect(planejadaEm(cancelada, 'grato')).toEqual([])
    expect(planejadaEm(m, 'meia-noite')).toEqual([])
  })
})

describe('vezesTocadaDesde', () => {
  it('conta só as Execuções dentro da janela de meses', () => {
    const m = ministerioDeExemplo('2026-09-08')

    expect(vezesTocadaDesde(m, 'meia-noite', 6)).toBe(2)
    expect(vezesTocadaDesde(ministerioDeExemplo('2027-03-20'), 'meia-noite', 6)).toBe(0)
    expect(vezesTocadaDesde(ministerioDeExemplo('2027-02-20'), 'meia-noite', 6)).toBe(1)
  })
})

describe('abaDaMusica e secaoDaMusica', () => {
  it('sem Execução vai pra Redescobrir na seção nunca', () => {
    const m = ministerioDeExemplo()

    expect(abaDaMusica(m, musicaPorId(m, 'rio'))).toBe('redescobrir')
    expect(secaoDaMusica(m, musicaPorId(m, 'rio'))).toBe('nunca')
  })

  it('tocada há menos de 3 meses vai pra Recentes, sem seção', () => {
    const m = ministerioDeExemplo()

    expect(abaDaMusica(m, musicaPorId(m, 'meia-noite'))).toBe('recentes')
    expect(secaoDaMusica(m, musicaPorId(m, 'meia-noite'))).toBeNull()
  })

  it('em 3 meses exatos já é Redescobrir, na seção paradas; um dia antes ainda é Recentes', () => {
    const noLimite = ministerioDeExemplo('2026-11-30')
    const umDiaAntes = ministerioDeExemplo('2026-11-29')

    expect(abaDaMusica(noLimite, musicaPorId(noLimite, 'meia-noite'))).toBe('redescobrir')
    expect(secaoDaMusica(noLimite, musicaPorId(noLimite, 'meia-noite'))).toBe('paradas')
    expect(abaDaMusica(umDiaAntes, musicaPorId(umDiaAntes, 'meia-noite'))).toBe('recentes')
  })
})

describe('coberturaDoMinisterio', () => {
  it('separa quem do ministério já tocou a Música de quem nunca tocou', () => {
    expect(coberturaDoMinisterio(ministerioDeExemplo(), 'grato')).toEqual({
      ja: ['Gabriel', 'Isa', 'Lucas', 'Rafa', 'Bia', 'Júlia'],
      nunca: ['Marcos', 'Pedro', 'Ana'],
    })
  })

  it('ignora inativos e quem só tem Função técnica', () => {
    const m = ministerioDeExemplo()
    const comInativa: Ministerio = {
      ...m,
      membros: m.membros.map((x) => (x.id === 'ana' ? { ...x, inativo: true } : x)),
    }
    const cobertura = coberturaDoMinisterio(comInativa, 'grato')

    expect(cobertura.nunca).not.toContain('Ana')
    expect([...cobertura.ja, ...cobertura.nunca]).not.toContain('Davi')
  })

  it('sem Execução, todo mundo está em nunca', () => {
    const cobertura = coberturaDoMinisterio(ministerioDeExemplo(), 'rio')

    expect(cobertura.ja).toEqual([])
    expect(cobertura.nunca).toHaveLength(9)
  })
})

describe('memória da Música no Item', () => {
  it('junta recente, última Execução e onde já está planejada', () => {
    const m = ministerioDeExemplo('2026-09-08')
    const comMeiaNoite = {
      ...m,
      escalas: m.escalas.map((escala) =>
        escala.id === 'e0920' ? { ...escala, itens: [inteira('x', 'meia-noite', 'G')] } : escala,
      ),
    }

    const memoria = memoriaDaMusica(comMeiaNoite, 'meia-noite', 4)

    expect(memoria.recente).toBe(true)
    expect(memoria.ultimaExecucao?.data).toBe('2026-08-30')
    expect(memoria.planejadaEm.map((p) => p.escalaId)).toEqual(['e0920'])
  })

  it('tira a Escala atual de planejadaEm e devolve nulo pra quem nunca tocou', () => {
    const m = ministerioDeExemplo('2026-09-08')
    const comRio = {
      ...m,
      escalas: m.escalas.map((escala) =>
        escala.id === 'e0920' ? { ...escala, itens: [inteira('x', 'rio', 'D')] } : escala,
      ),
    }

    const memoria = memoriaDaMusica(comRio, 'rio', 4, 'e0920')

    expect(memoria).toEqual({ recente: false, ultimaExecucao: null, planejadaEm: [] })
  })
})
