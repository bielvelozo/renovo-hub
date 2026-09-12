import { describe, expect, it } from 'vitest'
import type { MusicaNaLista, MusicaResumida, Resolucao, TomSugeridoApresentado } from '../api/tipos'
import {
  corpoDaPromocao,
  corpoDoItem,
  corpoDoMedley,
  descricaoNaLista,
  escolhaDaMusica,
  escolhaDoLink,
  linksPendentes,
  medleyPronto,
  rascunhoDe,
  rascunhoPronto,
  seloDaMusica,
  textoDaCobertura,
  textoDoHistorico,
  textoDoTomSugerido,
  trechoDe,
  trechoPronto,
  trechosComMusica,
} from './rascunho'

const HOJE = '2026-09-13'

const resumida = (id: string): MusicaResumida => ({
  id,
  titulo: 'Rio',
  artista: 'Renovo',
  videoId: 'v-' + id,
  capa: 'capa/' + id,
  capaAlternativa: 'alt/' + id,
})

const naLista = (extra: Partial<MusicaNaLista> = {}): MusicaNaLista => ({
  ...resumida('rio'),
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

const execucao = (extra: Partial<MusicaNaLista['ultimaExecucao'] & object> = {}) => ({
  escalaId: 'e0816',
  data: '2026-08-16',
  tom: 'C',
  parcial: false,
  ministradoPor: 'marcos',
  ministradoPorNome: 'Marcos',
  ...extra,
})

const resolucao = (musica: Resolucao['musica'] = null): Resolucao => ({
  videoId: 'hRJUcvsnqKs',
  titulo: 'Meia Noite',
  canal: 'Fhop Music',
  capa: 'capa/nova',
  capaAlternativa: 'alt/nova',
  musica,
})

const sugerido = (extra: Partial<TomSugeridoApresentado> = {}): TomSugeridoApresentado => ({
  tom: 'C',
  origem: 'execucao',
  data: '2026-08-16',
  ministradoPor: 'marcos',
  ministradoPorNome: 'Marcos',
  parcial: false,
  ...extra,
})

describe('escolha', () => {
  it('do catálogo guarda o id da Música e nenhum link pendente', () => {
    expect(escolhaDaMusica(resumida('rio'))).toEqual({ musicaId: 'rio', link: null, resumo: resumida('rio') })
  })

  it('de link fora do catálogo guarda o link e monta o resumo com os dados do YouTube', () => {
    const escolha = escolhaDoLink(resolucao(), 'https://youtu.be/hRJUcvsnqKs')

    expect(escolha.musicaId).toBeNull()
    expect(escolha.link).toBe('https://youtu.be/hRJUcvsnqKs')
    expect(escolha.resumo).toEqual({
      id: 'hRJUcvsnqKs',
      titulo: 'Meia Noite',
      artista: 'Fhop Music',
      videoId: 'hRJUcvsnqKs',
      capa: 'capa/nova',
      capaAlternativa: 'alt/nova',
    })
  })

  it('de link que já está no catálogo vira escolha do catálogo', () => {
    const jaTem = {
      ...naLista(),
      link: '',
      cifraClub: '',
      tomSugerido: null,
      historico: [],
      cobertura: null,
      coberturaDoMinisterio: { ja: [], nunca: [] },
      anexos: [],
    }
    const escolha = escolhaDoLink(resolucao(jaTem), 'https://youtu.be/v-rio')

    expect(escolha.musicaId).toBe('rio')
    expect(escolha.link).toBeNull()
  })
})

describe('rascunho de Item', () => {
  it('nasce inteira e com o Tom sugerido já selecionado', () => {
    const rascunho = rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido())

    expect(rascunho.modo).toBe('inteira')
    expect(rascunho.tom).toBe('C')
    expect(rascunho.observacao).toBe('')
  })

  it('nasce sem Tom quando não há sugestão', () => {
    expect(rascunhoDe(escolhaDaMusica(resumida('rio')), null).tom).toBeNull()
  })

  it('inteira fica pronta só com o Tom', () => {
    const rascunho = rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido())

    expect(rascunhoPronto(rascunho)).toBe(true)
    expect(rascunhoPronto({ ...rascunho, tom: null })).toBe(false)
  })

  it('trecho exige minutagem de início e fim no formato 1:05', () => {
    const base = { ...rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido()), modo: 'trecho' as const }

    expect(rascunhoPronto(base)).toBe(false)
    expect(rascunhoPronto({ ...base, inicio: '1:05', fim: '2:30' })).toBe(true)
    expect(rascunhoPronto({ ...base, inicio: '1:5', fim: '2:30' })).toBe(false)
    expect(rascunhoPronto({ ...base, inicio: '1:05', fim: '2:70' })).toBe(false)
  })

  it('vira corpo de Música inteira sem minutagem', () => {
    const rascunho = { ...rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido()), observacao: '  começar baixo ' }

    expect(corpoDoItem(rascunho, 'rio')).toEqual({
      tipo: 'inteira',
      musicaId: 'rio',
      tom: 'C',
      observacao: 'começar baixo',
      ministradoPor: null,
    })
  })

  it('vira corpo de Trecho com a minutagem', () => {
    const rascunho = {
      ...rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido()),
      modo: 'trecho' as const,
      inicio: '1:05',
      fim: '2:30',
    }

    expect(corpoDoItem(rascunho, 'rio')).toEqual({
      tipo: 'trecho',
      musicaId: 'rio',
      tom: 'C',
      inicio: '1:05',
      fim: '2:30',
      observacao: '',
      ministradoPor: null,
    })
  })

  it('vira corpo de promoção sem a Música, que a API resolve', () => {
    const rascunho = rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido())

    expect(corpoDaPromocao(rascunho, 'e0913')).toEqual({
      escalaId: 'e0913',
      tipo: 'inteira',
      tom: 'C',
      observacao: '',
      ministradoPor: null,
    })
  })

  it('leva quem puxa o Item pro corpo', () => {
    const rascunho = rascunhoDe(escolhaDaMusica(resumida('rio')), sugerido(), 'isa')

    expect(corpoDoItem(rascunho, 'rio')).toMatchObject({ ministradoPor: 'isa' })
    expect(corpoDaPromocao(rascunho, 'e0913')).toMatchObject({ ministradoPor: 'isa' })
  })
})

describe('medley', () => {
  const trecho = (id: string, extra = {}) => ({
    ...trechoDe(escolhaDaMusica(resumida(id)), sugerido(), false),
    inicio: '0:00',
    fim: '1:30',
    ...extra,
  })

  it('o primeiro Trecho já começa em 0:00 e os outros vêm vazios', () => {
    expect(trechoDe(escolhaDaMusica(resumida('rio')), null, true).inicio).toBe('0:00')
    expect(trechoDe(escolhaDaMusica(resumida('rio')), null, false).inicio).toBe('')
  })

  it('o Trecho exige Tom e as duas minutagens', () => {
    expect(trechoPronto(trecho('rio'))).toBe(true)
    expect(trechoPronto(trecho('rio', { tom: null }))).toBe(false)
    expect(trechoPronto(trecho('rio', { fim: '' }))).toBe(false)
  })

  it('precisa de pelo menos dois Trechos', () => {
    expect(medleyPronto([])).toBe(false)
    expect(medleyPronto([trecho('rio')])).toBe(false)
    expect(medleyPronto([trecho('rio'), trecho('dono')])).toBe(true)
  })

  it('lista os links pendentes uma vez só, mesmo repetidos', () => {
    const pendente = trechoDe(escolhaDoLink(resolucao(), 'https://youtu.be/hRJUcvsnqKs'), null, false)

    expect(linksPendentes([trecho('rio'), pendente, pendente])).toEqual(['https://youtu.be/hRJUcvsnqKs'])
  })

  it('troca os links pendentes pelas Músicas recém-criadas', () => {
    const pendente = { ...trechoDe(escolhaDoLink(resolucao(), 'https://youtu.be/x'), null, false), tom: 'G', inicio: '0:00', fim: '1:00' }

    expect(trechosComMusica([trecho('rio'), pendente], { 'https://youtu.be/x': 'nova' })).toEqual([
      { musicaId: 'rio', tom: 'C', inicio: '0:00', fim: '1:30' },
      { musicaId: 'nova', tom: 'G', inicio: '0:00', fim: '1:00' },
    ])
  })

  it('vira corpo de Medley com a observação aparada', () => {
    expect(corpoDoMedley([{ musicaId: 'rio', tom: 'C', inicio: '0:00', fim: '1:30' }], ' emenda ')).toEqual({
      tipo: 'medley',
      trechos: [{ musicaId: 'rio', tom: 'C', inicio: '0:00', fim: '1:30' }],
      observacao: 'emenda',
    })
  })
})

describe('textos', () => {
  it('o Tom sugerido diz de onde veio', () => {
    expect(textoDoTomSugerido(null)).toBe('Sem tom de partida: escolha.')
    expect(textoDoTomSugerido(sugerido(), HOJE)).toBe('Último Tom: C, tocado em dom, 16 de ago com Marcos. Já selecionado.')
    expect(textoDoTomSugerido(sugerido({ parcial: true }), HOJE)).toBe(
      'Último Tom: C, tocado em dom, 16 de ago com Marcos (trecho). Já selecionado.',
    )
    expect(textoDoTomSugerido(sugerido({ origem: 'conhecido', tom: 'G' }))).toBe(
      'Último tom conhecido: G, preenchido à mão. Já selecionado.',
    )
    expect(textoDoTomSugerido(sugerido({ origem: 'original', tom: 'E' }))).toBe(
      'Tom original da gravação: E. Já selecionado.',
    )
  })

  it('o histórico sai em uma linha', () => {
    expect(textoDoHistorico([execucao(), execucao({ data: '2026-08-30', tom: 'D', parcial: true })], HOJE)).toBe(
      'C em dom, 16 de ago (Marcos) · D em dom, 30 de ago (Marcos), trecho',
    )
  })

  it('a cobertura da Equipe conjuga quem já tocou', () => {
    expect(textoDaCobertura(null)).toBe('')
    expect(textoDaCobertura({ ja: [], nunca: ['Isa'] })).toBe('Ninguém da Equipe tocou ainda · Isa nunca.')
    expect(textoDaCobertura({ ja: ['Gabriel'], nunca: [] })).toBe('Gabriel já tocou.')
    expect(textoDaCobertura({ ja: ['Gabriel', 'Ana'], nunca: ['Isa'] })).toBe('Gabriel, Ana já tocaram · Isa nunca.')
  })

  it('a linha do catálogo mostra a última Execução, e o selo diz Legado ou Nova', () => {
    expect(descricaoNaLista(naLista({ ultimaExecucao: execucao() }), HOJE)).toBe('Renovo · última dom, 16 de ago')
    expect(descricaoNaLista(naLista({ ultimaExecucao: execucao({ parcial: true }) }), HOJE)).toBe(
      'Renovo · última dom, 16 de ago (trecho)',
    )
    expect(descricaoNaLista(naLista({ legado: true }))).toBe('Renovo')

    expect(seloDaMusica(naLista({ legado: true }))).toBe('legado')
    expect(seloDaMusica(naLista({ nova: true }))).toBe('nova')
    expect(seloDaMusica(naLista({ ultimaExecucao: execucao() }))).toBeNull()
  })
})
