import { describe, expect, it } from 'vitest'
import { ministerioDeExemplo } from './exemplo'
import { dadosDoInicio, posCultoDoMinistro } from './inicio'
import type { Escala, Ministerio } from './tipos'

const HOJE = '2026-09-08'

function escalaDe(id: string, data: string, extra: Partial<Escala> = {}): Escala {
  return {
    id,
    data,
    horario: '18:00',
    rotulo: 'Culto de Domingo',
    santaCeia: false,
    cancelada: false,
    equipe: [{ membroId: 'isa', funcoes: ['vocal'], ministro: true }],
    itens: [{ id: id + '-i1', tipo: 'inteira', musicaId: 'rio', tom: 'D', observacao: '', ministradoPor: null }],
    ...extra,
  }
}

function comEscalas(escalas: Escala[], hoje = HOJE): Ministerio {
  return { ...ministerioDeExemplo(hoje), escalas }
}

const ANTES = new Date('2026-09-14T01:29:00.000Z')
const NA_HORA = new Date('2026-09-14T01:30:00.000Z')
const DIA_SEGUINTE = new Date('2026-09-14T15:00:00.000Z')
const DOIS_DIAS_DEPOIS = new Date('2026-09-15T15:00:00.000Z')

describe('cartão pós-culto', () => {
  it('não aparece às 22:29 do dia da Escala', () => {
    const m = comEscalas([escalaDe('e0913', '2026-09-13')])

    expect(posCultoDoMinistro(m, 'isa', ANTES)).toBeNull()
  })

  it('aparece às 22:30 do dia da Escala', () => {
    const m = comEscalas([escalaDe('e0913', '2026-09-13')])

    expect(posCultoDoMinistro(m, 'isa', NA_HORA)).toEqual({
      escalaId: 'e0913',
      titulo: 'Culto de Domingo 18h',
      data: '2026-09-13',
      itens: 1,
    })
  })

  it('continua no dia seguinte e some no outro', () => {
    const m = comEscalas([escalaDe('e0913', '2026-09-13')])

    expect(posCultoDoMinistro(m, 'isa', DIA_SEGUINTE)?.escalaId).toBe('e0913')
    expect(posCultoDoMinistro(m, 'isa', DOIS_DIAS_DEPOIS)).toBeNull()
  })

  it('mostra a Escala mais recente quando duas estão na janela', () => {
    const m = comEscalas([escalaDe('e0913', '2026-09-13'), escalaDe('e0914', '2026-09-14')])

    expect(posCultoDoMinistro(m, 'isa', new Date('2026-09-15T01:35:00.000Z'))?.escalaId).toBe('e0914')
  })

  it('ignora Escala cancelada, sem músicas ou de outro Ministro', () => {
    const cancelada = comEscalas([escalaDe('e0913', '2026-09-13', { cancelada: true })])
    const semMusicas = comEscalas([escalaDe('e0913', '2026-09-13', { itens: [] })])
    const m = comEscalas([escalaDe('e0913', '2026-09-13')])

    expect(posCultoDoMinistro(cancelada, 'isa', NA_HORA)).toBeNull()
    expect(posCultoDoMinistro(semMusicas, 'isa', NA_HORA)).toBeNull()
    expect(posCultoDoMinistro(m, 'marcos', NA_HORA)).toBeNull()
  })
})

describe('dados do Início', () => {
  const AGORA = new Date('2026-09-08T15:00:00.000Z')

  it('mostra a escala da pessoa e nenhum próximo culto quando são a mesma', () => {
    const dados = dadosDoInicio(ministerioDeExemplo(HOJE), 'gabriel', AGORA)

    expect(dados.minhaProxima?.id).toBe('e0913')
    expect(dados.proximoCulto).toBeNull()
  })

  it('mostra o próximo culto pra quem não está em nenhuma escala agendada', () => {
    const dados = dadosDoInicio(ministerioDeExemplo(HOJE), 'rafa', AGORA)

    expect(dados.minhaProxima).toBeNull()
    expect(dados.proximoCulto?.id).toBe('e0913')
  })

  it('não cobra pendência de quem não dirige', () => {
    expect(dadosDoInicio(ministerioDeExemplo(HOJE), 'rafa', AGORA).pendencias).toEqual([])
    expect(dadosDoInicio(ministerioDeExemplo(HOJE), 'rafa', AGORA).proximoMesVazio).toBeNull()
  })

  it('lista as pendências das próximas quatro semanas pra quem dirige', () => {
    const dados = dadosDoInicio(ministerioDeExemplo(HOJE), 'gabriel', AGORA)

    expect(dados.pendencias.map((escala) => escala.id)).toEqual(['e0913', 'e0920', 'e0927'])
  })

  it('deixa de fora a agendada que passa das quatro semanas', () => {
    const m = comEscalas([escalaDe('longe', '2026-10-11', { equipe: [], itens: [] })])

    expect(dadosDoInicio(m, 'gabriel', AGORA).pendencias).toEqual([])
  })

  it('aponta o mês seguinte quando ele está sem escala', () => {
    expect(dadosDoInicio(ministerioDeExemplo(HOJE), 'gabriel', AGORA).proximoMesVazio).toBe('2026-10')
  })

  it('aponta o mês corrente quando nem ele tem escala', () => {
    const m = comEscalas([escalaDe('e0816', '2026-08-16')])

    expect(dadosDoInicio(m, 'gabriel', AGORA).proximoMesVazio).toBe('2026-09')
  })

  it('não aponta mês nenhum quando os dois têm escala', () => {
    const m = comEscalas([escalaDe('e0913', '2026-09-13'), escalaDe('e1004', '2026-10-04')])

    expect(dadosDoInicio(m, 'gabriel', AGORA).proximoMesVazio).toBeNull()
  })
})
