import { describe, expect, it } from 'vitest'
import type { MusicaResumida, SugestaoApresentada } from '../api/tipos'
import type { Escolha } from './rascunho'
import { corpoDaSugestao, diaDaSugestao, podeApagar, textoDosApoios } from './sugestoes'

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
