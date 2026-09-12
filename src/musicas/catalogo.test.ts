import { describe, expect, it } from 'vitest'
import type { MusicaNaLista, TomSugeridoApresentado } from '../api/tipos'
import { agruparCatalogo, aplicarVer, contagemPorAba, selosDaMusica, textoDoUltimoTom } from './catalogo'

const HOJE = '2026-09-13'

describe('último Tom fora da tela de adicionar', () => {
  const sugerido = (parcial: Partial<TomSugeridoApresentado> = {}): TomSugeridoApresentado => ({
    tom: 'C',
    origem: 'execucao',
    data: '2026-08-16',
    ministradoPor: 'marcos',
    ministradoPorNome: 'Marcos',
    parcial: false,
    ...parcial,
  })

  it('não promete seleção nenhuma, porque aqui não há grade de Tons', () => {
    expect(textoDoUltimoTom(sugerido(), HOJE)).toBe('Último Tom: C, tocado em dom, 16 de ago com Marcos.')
    expect(textoDoUltimoTom(sugerido({ parcial: true }), HOJE)).toBe('Último Tom: C, tocado em dom, 16 de ago com Marcos (trecho).')
  })

  it('diz de onde veio o Tom quando não há Execução', () => {
    expect(textoDoUltimoTom(sugerido({ origem: 'conhecido', tom: 'G' }))).toBe(
      'Último tom conhecido: G, preenchido à mão.',
    )
    expect(textoDoUltimoTom(sugerido({ origem: 'original', tom: 'E' }))).toBe('Tom original da gravação: E.')
  })

  it('Música sem Tom nenhum explica o vazio em vez de mandar escolher', () => {
    expect(textoDoUltimoTom(null)).toBe('Sem Tom conhecido: ninguém tocou e ninguém preencheu à mão.')
  })
})

describe('selosDaMusica', () => {
  const base: MusicaNaLista = {
    id: 'meia-noite',
    titulo: 'Meia Noite',
    artista: 'Fhop Music',
    videoId: 'hRJUcvsnqKs',
    capa: '',
    capaAlternativa: '',
    legado: false,
    nova: false,
    arquivada: false,
    revisar: false,
    tomConhecido: null,
    tomOriginal: null,
    aba: 'redescobrir',
    secao: 'nunca',
    recente: false,
    planejadaEm: [],
    vezesTocada: 0,
    vezesEm6Meses: 0,
    temLetra: false,
    ultimaExecucao: null,
  }

  const execucao = {
    escalaId: 'e0816',
    data: '2026-08-16',
    tom: 'C',
    parcial: false,
    ministradoPor: 'marcos',
    ministradoPorNome: 'Marcos',
  }

  it('mostra o Tom, a data e quem ministrou da última vez', () => {
    expect(selosDaMusica({ ...base, ultimaExecucao: execucao }, HOJE)).toEqual([
      { chave: 'tom', texto: 'Tom C' },
      { chave: 'quando', texto: 'há 4 semanas · Marcos' },
    ])
  })

  it('marca o trecho e dispensa o nome quando ninguém ministrou', () => {
    expect(
      selosDaMusica({
        ...base,
        ultimaExecucao: { ...execucao, parcial: true, ministradoPor: null, ministradoPorNome: null },
      }, HOJE),
    ).toEqual([
      { chave: 'tom', texto: 'Tom C' },
      { chave: 'quando', texto: 'há 4 semanas' },
      { chave: 'parcial', texto: 'trecho' },
    ])
  })

  it('diz que nunca foi tocada, com o Tom preenchido à mão quando existe', () => {
    expect(selosDaMusica({ ...base, tomConhecido: 'G' })).toEqual([
      { chave: 'tom', texto: 'Tom G' },
      { chave: 'nunca', texto: 'nunca tocada no app' },
    ])
  })

  it('cai no tom original da gravação quando não há outro', () => {
    expect(selosDaMusica({ ...base, tomOriginal: 'E' })).toEqual([
      { chave: 'tom', texto: 'Tom E · original' },
      { chave: 'nunca', texto: 'nunca tocada no app' },
    ])
  })

  it('não inventa selo de Tom quando não há Tom nenhum', () => {
    expect(selosDaMusica(base)).toEqual([{ chave: 'nunca', texto: 'nunca tocada no app' }])
  })

  it('mantém Legado e Nova depois do histórico', () => {
    expect(selosDaMusica({ ...base, legado: true }).at(-1)).toEqual({ chave: 'legado', texto: 'Legado' })
    expect(selosDaMusica({ ...base, nova: true }).at(-1)).toEqual({ chave: 'nova', texto: 'Nova' })
  })
})

describe('agruparCatalogo', () => {
  const musica = (id: string, titulo: string, extra: Partial<MusicaNaLista> = {}): MusicaNaLista => ({
    id,
    titulo,
    artista: 'Renovo',
    videoId: 'v-' + id,
    capa: '',
    capaAlternativa: '',
    legado: false,
    nova: false,
    arquivada: false,
    revisar: false,
    tomConhecido: null,
    tomOriginal: null,
    aba: 'redescobrir',
    secao: 'nunca',
    recente: false,
    planejadaEm: [],
    vezesTocada: 0,
    vezesEm6Meses: 0,
    temLetra: false,
    ultimaExecucao: null,
    ...extra,
  })

  const tocada = (data: string) => ({
    escalaId: 'e' + data,
    data,
    tom: 'C',
    parcial: false,
    ministradoPor: null,
    ministradoPorNome: null,
  })

  const catalogo = [
    musica('zebra', 'Zebra'),
    musica('agua', 'Água Viva'),
    musica('acorda', 'Acorda'),
    musica('firme', 'Firme', { aba: 'redescobrir', secao: 'paradas', ultimaExecucao: tocada('2025-01-10'), vezesTocada: 1 }),
    musica('rio', 'Rio', { aba: 'redescobrir', secao: 'paradas', ultimaExecucao: tocada('2024-06-01'), vezesTocada: 1 }),
    musica('meia', 'Meia Noite', { aba: 'recentes', secao: null, recente: true, ultimaExecucao: tocada('2026-09-06') }),
    musica('grato', 'Grato Sou', { aba: 'recentes', secao: null, recente: true, ultimaExecucao: tocada('2026-08-30') }),
    musica('sublime', 'Sublime', { aba: 'recentes', secao: null, recente: false, ultimaExecucao: tocada('2026-07-05') }),
    musica('dez', '10 Mil Razões', { aba: 'recentes', secao: null, recente: false, ultimaExecucao: tocada('2026-08-01') }),
  ]

  const ids = (secao: { musicas: MusicaNaLista[] }) => secao.musicas.map((m) => m.id)

  it('conta as músicas de cada aba, e Todas soma as duas', () => {
    expect(contagemPorAba(catalogo)).toEqual({ redescobrir: 5, recentes: 4, todas: 9 })
  })

  it('Redescobrir abre com as nunca tocadas por título e depois as paradas da mais antiga pra mais nova', () => {
    const secoes = agruparCatalogo(catalogo, 'redescobrir', 4)

    expect(secoes.map((s) => [s.chave, s.titulo])).toEqual([
      ['nunca', 'Nunca tocada no app'],
      ['paradas', 'Paradas há 3 meses ou mais'],
    ])
    expect(ids(secoes[0])).toEqual(['acorda', 'agua', 'zebra'])
    expect(ids(secoes[1])).toEqual(['rio', 'firme'])
    expect(secoes.every((s) => !s.atencao)).toBe(true)
  })

  it('Recentes põe as das últimas semanas em atenção, da mais nova pra mais antiga, e o resto depois', () => {
    const secoes = agruparCatalogo(catalogo, 'recentes', 6)

    expect(secoes.map((s) => [s.titulo, s.atencao])).toEqual([
      ['Últimas 6 semanas', true],
      ['Últimos 3 meses', false],
    ])
    expect(ids(secoes[0])).toEqual(['meia', 'grato'])
    expect(ids(secoes[1])).toEqual(['dez', 'sublime'])
  })

  it('Recentes sem música recente não mostra a seção de atenção', () => {
    const semRecentes = catalogo.map((m) => ({ ...m, recente: false }))

    expect(agruparCatalogo(semRecentes, 'recentes', 4).map((s) => s.chave)).toEqual(['tres-meses'])
  })

  it('Todas sai em ordem alfabética sem acento, com uma seção por letra e # pra número', () => {
    const secoes = agruparCatalogo(catalogo, 'todas', 4)

    expect(secoes.map((s) => s.titulo)).toEqual(['#', 'A', 'F', 'G', 'M', 'R', 'S', 'Z'])
    expect(ids(secoes[1])).toEqual(['acorda', 'agua'])
    expect(secoes.reduce((n, s) => n + s.musicas.length, 0)).toBe(9)
  })

  it('o menu Ver recorta por quem escolheu e por letra', () => {
    const comDono = [
      musica('a', 'A', { ultimaExecucao: { ...tocada('2026-01-01'), ministradoPor: 'isa' } }),
      musica('b', 'B', { ultimaExecucao: { ...tocada('2026-01-01'), ministradoPor: 'marcos' } }),
      musica('c', 'C', { temLetra: true }),
    ]

    expect(aplicarVer(comDono, 'todas', 'isa').map((m) => m.id)).toEqual(['a', 'b', 'c'])
    expect(aplicarVer(comDono, 'minhas', 'isa').map((m) => m.id)).toEqual(['a'])
    expect(aplicarVer(comDono, 'outros', 'isa').map((m) => m.id)).toEqual(['b'])
    expect(aplicarVer(comDono, 'com-letra', 'isa').map((m) => m.id)).toEqual(['c'])
  })

  it('seções vazias não aparecem', () => {
    expect(agruparCatalogo([], 'redescobrir', 4)).toEqual([])
    expect(agruparCatalogo([musica('zebra', 'Zebra')], 'redescobrir', 4).map((s) => s.chave)).toEqual(['nunca'])
  })
})
