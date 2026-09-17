import { describe, expect, it } from 'vitest'
import type { EscalaDoCulto, ItemDoCulto, MusicaDoCulto } from '../api/tipos'
import type { Letra } from '../dominio'
import {
  buscarNoCatalogo,
  dicaDoItem,
  itemAnterior,
  itemSeguinte,
  letrasDoMedley,
  maisTocadas,
  posicaoDoItem,
  quandoAtualizado,
  tituloDaOrdem,
  tituloDoCulto,
  tituloDoItem,
  tonsDoMedley,
  ultimoTomTocado,
} from './culto'

function letraDe(texto: string): Letra {
  return { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto, forte: false }] }] }
}

function musica(id: string, titulo: string, extras: Partial<MusicaDoCulto> = {}): MusicaDoCulto {
  return { id, titulo, artista: 'Renovo', tom: null, vezesTocada: 0, letra: null, ...extras }
}

function inteira(id: string, musicaId: string, titulo: string, tom = 'G'): ItemDoCulto {
  return { id, tipo: 'inteira', musicaId, titulo, artista: 'Renovo', tom, inicio: null, fim: null, observacao: '' }
}

function medley(trechos: [string, string][], letra: Letra | null = null): ItemDoCulto {
  return {
    id: 'i-medley',
    tipo: 'medley',
    trechos: trechos.map(([musicaId, tom]) => ({
      musicaId,
      titulo: musicaId === 'rio' ? 'Rio' : 'Sublime',
      artista: 'Renovo',
      tom,
      inicio: '0:00',
      fim: '2:30',
    })),
    observacao: '',
    letra,
  }
}

const ITENS = [inteira('i1', 'rio', 'Rio'), inteira('i2', 'dono', 'Dono do Mundo'), inteira('i3', 'sublime', 'Sublime')]

describe('andar pela ordem', () => {
  it('acha o anterior e o seguinte', () => {
    expect(itemAnterior(ITENS, 'i2')?.id).toBe('i1')
    expect(itemSeguinte(ITENS, 'i2')?.id).toBe('i3')
  })

  it('não tem anterior no começo nem seguinte no fim', () => {
    expect(itemAnterior(ITENS, 'i1')).toBeNull()
    expect(itemSeguinte(ITENS, 'i3')).toBeNull()
  })

  it('cala quando o Item não é da Escala', () => {
    expect(itemAnterior(ITENS, 'nada')).toBeNull()
    expect(itemSeguinte(ITENS, 'nada')).toBeNull()
  })

  it('numera o Item a partir de um', () => {
    expect(posicaoDoItem(ITENS, 'i3')).toBe(3)
    expect(posicaoDoItem(ITENS, 'nada')).toBe(0)
  })
})

describe('letra do Medley', () => {
  const catalogo = [
    musica('rio', 'Rio', { letra: letraDe('E me mostrou um rio') }),
    musica('sublime', 'Sublime', { letra: letraDe('Quem é como Tu?') }),
    musica('dono', 'Dono do Mundo'),
  ]

  it('usa a letra do Item quando o Medley tem Word próprio', () => {
    const doItem = letraDe('Maranata, maranata')

    expect(
      letrasDoMedley(
        medley(
          [
            ['rio', 'D'],
            ['sublime', 'A'],
          ],
          doItem,
        ),
        catalogo,
      ),
    ).toEqual(doItem)
  })

  it('emenda as letras das músicas, cada uma com o título antes', () => {
    const letra = letrasDoMedley(
      medley([
        ['rio', 'D'],
        ['sublime', 'A'],
      ]),
      catalogo,
    )

    expect(letra).toEqual({
      cabecalho: [],
      blocos: [
        { tipo: 'marcador', texto: 'Rio' },
        { tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] },
        { tipo: 'marcador', texto: 'Sublime' },
        { tipo: 'estrofe', linhas: [{ texto: 'Quem é como Tu?', forte: false }] },
      ],
    })
  })

  it('deixa de fora a música sem letra e cala quando nenhuma tem', () => {
    const comUma = letrasDoMedley(
      medley([
        ['rio', 'D'],
        ['dono', 'C'],
      ]),
      catalogo,
    )

    expect(comUma?.blocos.map((bloco) => bloco.tipo === 'marcador' && bloco.texto)).toEqual([
      'Rio',
      false,
    ])
    expect(letrasDoMedley(medley([['dono', 'C']]), catalogo)).toBeNull()
  })
})

describe('título e dica do Item', () => {
  const catalogo = [musica('rio', 'Rio', { letra: letraDe('E me mostrou um rio') }), musica('dono', 'Dono do Mundo')]

  it('junta os títulos dos trechos no Medley', () => {
    expect(
      tituloDoItem(
        medley([
          ['rio', 'D'],
          ['sublime', 'A'],
        ]),
      ),
    ).toBe('Medley: Rio + Sublime')
    expect(tituloDoItem(inteira('i1', 'rio', 'Rio'))).toBe('Rio')
  })

  it('conta os trechos e aponta a letra', () => {
    expect(dicaDoItem(inteira('i1', 'rio', 'Rio'), catalogo)).toBe('Renovo · letra')
    expect(dicaDoItem(inteira('i2', 'dono', 'Dono do Mundo'), catalogo)).toBe('Renovo')
    expect(
      dicaDoItem(
        medley([
          ['rio', 'D'],
          ['dono', 'C'],
        ]),
        catalogo,
      ),
    ).toBe('2 trechos · letra')
    expect(dicaDoItem(medley([['dono', 'C']]), catalogo)).toBe('1 trecho')
  })

  it('abrevia o tom original entre os tons do Medley', () => {
    expect(
      tonsDoMedley(
        medley([
          ['rio', 'D'],
          ['sublime', 'original'],
        ]),
      ),
    ).toBe('D · orig.')
  })
})

describe('pesquisa no catálogo', () => {
  const catalogo = [
    musica('coracao', 'Coração', { vezesTocada: 2 }),
    musica('rio', 'Rio', { vezesTocada: 5 }),
    musica('avivah', 'Avivah', { vezesTocada: 5 }),
    musica('dono', 'Dono do Mundo', { artista: 'Coral', vezesTocada: 0 }),
  ]

  it('acha sem acento, no título e no artista', () => {
    expect(buscarNoCatalogo(catalogo, 'coracao').map((m) => m.id)).toEqual(['coracao'])
    expect(buscarNoCatalogo(catalogo, 'CORAÇÃO').map((m) => m.id)).toEqual(['coracao'])
    expect(buscarNoCatalogo(catalogo, 'coral').map((m) => m.id)).toEqual(['dono'])
  })

  it('devolve em ordem alfabética e nada quando não acha', () => {
    expect(buscarNoCatalogo(catalogo, 'o').map((m) => m.id)).toEqual(['avivah', 'coracao', 'dono', 'rio'])
    expect(buscarNoCatalogo(catalogo, 'zzz')).toEqual([])
  })

  it('mostra as mais tocadas, desempatando por título', () => {
    expect(maisTocadas(catalogo, 3).map((m) => m.id)).toEqual(['avivah', 'rio', 'coracao'])
  })
})

describe('textos do modo culto', () => {
  const escala: EscalaDoCulto = {
    id: 'e1',
    data: '2026-09-20',
    horario: '18:00',
    titulo: 'Culto de Domingo 18h',
    itens: [],
  }

  it('separa o horário do nome da Escala', () => {
    expect(tituloDoCulto(escala)).toBe('Culto de Domingo · 18h')
  })

  it('diz «de hoje» só no dia da Escala', () => {
    expect(tituloDaOrdem(escala, '2026-09-20')).toBe('Ordem de hoje')
    expect(tituloDaOrdem(escala, '2026-09-16')).toBe('Ordem de dom, 20 de set')
  })

  it('diz quando o pacote foi atualizado', () => {
    expect(quandoAtualizado('2026-09-12T17:00:00.000Z')).toBe('sáb, 14h')
  })

  it('conta o último tom tocado e cala o que não veio de Execução', () => {
    expect(
      ultimoTomTocado({ valor: 'G', origem: 'execucao', data: '2026-08-24', ministradoPorNome: 'Isa' }),
    ).toBe('último: G · Isa, 24/08')
    expect(ultimoTomTocado({ valor: 'G', origem: 'execucao', data: '2026-08-24', ministradoPorNome: null })).toBe(
      'último: G · 24/08',
    )
    expect(ultimoTomTocado({ valor: 'C', origem: 'conhecido' })).toBeNull()
    expect(ultimoTomTocado(null)).toBeNull()
  })
})
