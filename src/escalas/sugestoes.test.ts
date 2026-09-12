import { describe, expect, it } from 'vitest'
import type { MusicaResumida, SugestaoApresentada } from '../api/tipos'
import type { Escolha } from './rascunho'
import {
  contarNovas,
  corpoDaSugestao,
  diaDaSugestao,
  podeApagar,
  tempoDaSugestao,
  textoDeAceita,
  textoDeGuardada,
  textoDeQuemSugeriu,
  textoDeRecusada,
  textoDosApoios,
} from './sugestoes'

describe('sugestoes', () => {
  it('mostra só o dia do carimbo de tempo que o banco guarda', () => {
    expect(diaDaSugestao('2026-09-05T06:33:12.887Z', '2026-09-13')).toBe('sáb, 5 de set')
  })

  it('conta o dia pelo fuso de Brasília, e não pelo UTC', () => {
    expect(diaDaSugestao('2026-09-06T01:30:00.000Z', '2026-09-13')).toBe('sáb, 5 de set')
  })

  it('conjuga apoia e apoiam, e diz quando ninguém apoiou', () => {
    expect(textoDosApoios([])).toBe('ninguém apoiou ainda')
    expect(textoDosApoios([{ id: 'isa', nome: 'Isa' }])).toBe('Isa apoia')
    expect(
      textoDosApoios([
        { id: 'isa', nome: 'Isa' },
        { id: 'julia', nome: 'Júlia' },
      ]),
    ).toBe('Isa, Júlia apoiam')
  })
})

const RIO: MusicaResumida = {
  id: 'rio',
  titulo: 'Rio',
  artista: 'Central MSC',
  videoId: 's1oU-6vYc4E',
  capa: 'capa',
  capaAlternativa: 'outra',
}

function escolha(parcial: Partial<Escolha>): Escolha {
  return { musicaId: null, link: null, resumo: RIO, ...parcial }
}

describe('corpo da Sugestão', () => {
  it('Música do catálogo viaja só com o id', () => {
    expect(corpoDaSugestao(escolha({ musicaId: 'rio' }), '  cabe no fim  ')).toEqual({
      musicaId: 'rio',
      observacao: 'cabe no fim',
    })
  })

  it('link solto leva o título que veio do oEmbed, que a API exige', () => {
    expect(corpoDaSugestao(escolha({ link: 'https://youtu.be/abc' }), '')).toEqual({
      link: 'https://youtu.be/abc',
      titulo: 'Rio',
      observacao: '',
    })
  })
})

describe('apagar Sugestão', () => {
  const sugestao = { id: 's1', membro: { id: 'julia', nome: 'Júlia' } } as SugestaoApresentada

  it('quem sugeriu apaga a própria', () => {
    expect(podeApagar(sugestao, { id: 'julia', admin: false })).toBe(true)
  })

  it('o Admin apaga qualquer uma', () => {
    expect(podeApagar(sugestao, { id: 'gabriel', admin: true })).toBe(true)
  })

  it('Membro comum não apaga a dos outros', () => {
    expect(podeApagar(sugestao, { id: 'marcos', admin: false })).toBe(false)
  })
})

describe('tempoDaSugestao', () => {
  it('conta pelo fuso de Brasília, não pelo UTC', () => {
    expect(tempoDaSugestao('2026-09-06T01:30:00.000Z', '2026-09-13')).toBe('há 8 dias')
    expect(tempoDaSugestao('2026-09-10T15:00:00.000Z', '2026-09-13')).toBe('há 3 dias')
  })
})

describe('textos de estado da Sugestão', () => {
  const sugestao = {
    membro: { id: 'julia', nome: 'Júlia' },
    data: '2026-09-10T15:00:00.000Z',
  } as SugestaoApresentada

  it('quem sugeriu e há quanto tempo', () => {
    expect(textoDeQuemSugeriu(sugestao, '2026-09-13')).toBe('Júlia sugeriu · há 3 dias')
  })

  it('guardada há quanto tempo', () => {
    expect(textoDeGuardada('2026-08-30T12:00:00.000Z', '2026-09-13')).toBe('guardada há 2 semanas')
  })

  it('aceita mostra o dia da Escala e quem decidiu', () => {
    expect(
      textoDeAceita(
        {
          ...sugestao,
          escala: { id: 'e1', data: '2026-09-20', titulo: 'Culto' },
          decididaPor: { id: 'isa', nome: 'Isa' },
        } as SugestaoApresentada,
        '2026-09-13',
      ),
    ).toBe('entrou em dom, 20 de set · Isa')
  })

  it('recusada mostra o motivo quando houver', () => {
    expect(textoDeRecusada('')).toBe('não entrou')
    expect(textoDeRecusada('já tocamos muito esse mês')).toBe('não entrou · já tocamos muito esse mês')
  })
})

describe('contarNovas', () => {
  const aberta = (id: string, data: string) => ({ id, estado: 'aberta', data }) as SugestaoApresentada
  const guardada = (id: string, data: string) => ({ id, estado: 'guardada', data }) as SugestaoApresentada

  it('sem carimbo de visita, conta todas as abertas', () => {
    expect(contarNovas([aberta('a', '2026-09-10T00:00:00.000Z'), guardada('b', '2026-09-11T00:00:00.000Z')], null)).toBe(1)
  })

  it('só conta as abertas depois da última visita', () => {
    const sugestoes = [aberta('a', '2026-09-10T00:00:00.000Z'), aberta('b', '2026-09-12T00:00:00.000Z')]
    expect(contarNovas(sugestoes, '2026-09-11T00:00:00.000Z')).toBe(1)
  })

  it('ignora as que não estão abertas', () => {
    expect(contarNovas([guardada('a', '2026-09-12T00:00:00.000Z')], '2026-09-01T00:00:00.000Z')).toBe(0)
  })
})
