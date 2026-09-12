import { describe, expect, it } from 'vitest'
import type { MusicaNaLista, TomSugeridoApresentado } from '../api/tipos'
import { FILTROS, caminhoDoCatalogo, selosDaMusica, textoDoUltimoTom, textoDoVazio } from './catalogo'

const HOJE = '2026-09-13'

describe('filtros do catálogo', () => {
  it('todas na ordem de sempre não leva nada na URL', () => {
    expect(caminhoDoCatalogo('todas', 'mais-tempo')).toBe('/api/musicas')
  })

  it('a ordem invertida entra na URL, com ou sem filtro', () => {
    expect(caminhoDoCatalogo('todas', 'menos-tempo')).toBe('/api/musicas?ordem=menos-tempo')
    expect(caminhoDoCatalogo('nova', 'menos-tempo')).toBe('/api/musicas?filtro=nova&ordem=menos-tempo')
  })

  it('tocadas uma vez só é filtro da rota', () => {
    expect(caminhoDoCatalogo('uma-vez', 'mais-tempo')).toBe('/api/musicas?filtro=uma-vez')
  })

  it('Nova e Legado viram o filtro da rota', () => {
    expect(caminhoDoCatalogo('nova', 'mais-tempo')).toBe('/api/musicas?filtro=nova')
    expect(caminhoDoCatalogo('legado', 'mais-tempo')).toBe('/api/musicas?filtro=legado')
  })

  it('faz tempo vira meses, que a rota conta a partir da última Execução', () => {
    expect(caminhoDoCatalogo('meses-3', 'mais-tempo')).toBe('/api/musicas?meses=3')
    expect(caminhoDoCatalogo('meses-12', 'mais-tempo')).toBe('/api/musicas?meses=12')
  })

  it('todo filtro oferecido tem rótulo e caminho', () => {
    expect(FILTROS.map((filtro) => filtro.valor)).toEqual([
      'todas',
      'nova',
      'legado',
      'uma-vez',
      'meses-3',
      'meses-6',
      'meses-12',
    ])
    expect(FILTROS.every((filtro) => filtro.rotulo.length > 0)).toBe(true)
    expect(FILTROS.every((filtro) => caminhoDoCatalogo(filtro.valor, 'mais-tempo').startsWith('/api/musicas'))).toBe(
      true,
    )
  })

  it('os rótulos dos meses dizem o corte', () => {
    expect(FILTROS.find((filtro) => filtro.valor === 'meses-6')?.rotulo).toBe('+ de 6 meses')
  })
})

describe('catálogo vazio', () => {
  it('explica o vazio de cada filtro', () => {
    expect(textoDoVazio('todas', '')).toBe('Nenhuma Música no catálogo ainda.')
    expect(textoDoVazio('nova', '')).toBe('Nenhuma Música Nova: todas já foram tocadas ou vieram da playlist.')
    expect(textoDoVazio('legado', '')).toBe('Nenhuma Música de Legado: todas já foram tocadas no app.')
    expect(textoDoVazio('meses-6', '')).toBe('Nenhuma Música parada há mais de 6 meses.')
  })

  it('com busca, o vazio fala da busca', () => {
    expect(textoDoVazio('todas', 'coracao')).toBe('Nenhuma Música com esse texto.')
    expect(textoDoVazio('legado', 'coracao')).toBe('Nenhuma Música com esse texto.')
  })
})

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
      { chave: 'quando', texto: 'dom, 16 de ago · Marcos' },
    ])
  })

  it('marca o trecho e dispensa o nome quando ninguém ministrou', () => {
    expect(
      selosDaMusica({
        ...base,
        ultimaExecucao: { ...execucao, parcial: true, ministradoPor: null, ministradoPorNome: null },
      }),
    ).toEqual([
      { chave: 'tom', texto: 'Tom C' },
      { chave: 'quando', texto: 'dom, 16 de ago' },
      { chave: 'parcial', texto: 'trecho' },
    ])
  })

  it('diz que nunca foi tocada, com o Tom preenchido à mão quando existe', () => {
    expect(selosDaMusica({ ...base, tomConhecido: 'G' })).toEqual([
      { chave: 'tom', texto: 'Tom G' },
      { chave: 'nunca', texto: 'nunca tocada' },
    ])
  })

  it('cai no tom original da gravação quando não há outro', () => {
    expect(selosDaMusica({ ...base, tomOriginal: 'E' })).toEqual([
      { chave: 'tom', texto: 'Tom E · original' },
      { chave: 'nunca', texto: 'nunca tocada' },
    ])
  })

  it('não inventa selo de Tom quando não há Tom nenhum', () => {
    expect(selosDaMusica(base)).toEqual([{ chave: 'nunca', texto: 'nunca tocada' }])
  })

  it('mantém Legado e Nova depois do histórico', () => {
    expect(selosDaMusica({ ...base, legado: true }).at(-1)).toEqual({ chave: 'legado', texto: 'Legado' })
    expect(selosDaMusica({ ...base, nova: true }).at(-1)).toEqual({ chave: 'nova', texto: 'Nova' })
  })
})
