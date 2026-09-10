import { describe, expect, it } from 'vitest'
import type { ItemApresentado, MusicaResumida } from '../api/tipos'
import { capasDoItem, resumoDoItem, tituloDoItem, videosDoRepertorio } from './repertorio'

const musica = (id: string, titulo: string): MusicaResumida => ({
  id,
  titulo,
  artista: 'Renovo',
  videoId: 'v-' + id,
  capa: 'capa/' + id,
  capaAlternativa: 'alt/' + id,
})

const inteira: ItemApresentado = {
  id: 'i1',
  tipo: 'inteira',
  observacao: '',
  ministradoPor: null,
  descricao: 'Rio · Tom D',
  musicaId: 'rio',
  tom: 'D',
  musica: musica('rio', 'Rio'),
  link: 'https://youtu.be/v-rio',
}

const trecho: ItemApresentado = {
  id: 'i2',
  tipo: 'trecho',
  observacao: '',
  ministradoPor: null,
  descricao: 'Dono (1:05–2:30) · Tom F',
  musicaId: 'dono',
  tom: 'F',
  inicio: '1:05',
  fim: '2:30',
  musica: musica('dono', 'Dono da Minha Afeição'),
  link: 'https://youtu.be/v-dono?t=65',
}

const medley: ItemApresentado = {
  id: 'i3',
  tipo: 'medley',
  observacao: '',
  ministradoPor: null,
  descricao: 'Medley: Rio (0:10–1:00, Tom D) + Dono (1:05–2:30, Tom F)',
  trechos: [
    { musicaId: 'rio', tom: 'D', inicio: '0:10', fim: '1:00', musica: musica('rio', 'Rio'), link: 'x' },
    { musicaId: 'dono', tom: 'F', inicio: '1:05', fim: '2:30', musica: musica('dono', 'Dono'), link: 'y' },
  ],
}

describe('tituloDoItem', () => {
  it('usa o título da Música na inteira e no trecho', () => {
    expect(tituloDoItem(inteira)).toBe('Rio')
    expect(tituloDoItem(trecho)).toBe('Dono da Minha Afeição')
  })

  it('chama o Medley de Medley', () => {
    expect(tituloDoItem(medley)).toBe('Medley')
  })
})

describe('resumoDoItem', () => {
  it('mostra só o Tom da Música inteira', () => {
    expect(resumoDoItem(inteira)).toBe('Tom D')
  })

  it('mostra a minutagem e o Tom do trecho', () => {
    expect(resumoDoItem(trecho)).toBe('1:05–2:30 · Tom F')
  })

  it('encadeia os trechos do Medley com o Tom de cada um', () => {
    expect(resumoDoItem(medley)).toBe('Rio 0:10–1:00 · Tom D + Dono 1:05–2:30 · Tom F')
  })
})

describe('capasDoItem', () => {
  it('devolve uma capa pra inteira e pro trecho', () => {
    expect(capasDoItem(inteira).map((m) => m.id)).toEqual(['rio'])
    expect(capasDoItem(trecho).map((m) => m.id)).toEqual(['dono'])
  })

  it('devolve a capa de cada trecho do Medley, no máximo quatro', () => {
    expect(capasDoItem(medley).map((m) => m.id)).toEqual(['rio', 'dono'])

    const cheio = { ...medley, trechos: [...medley.trechos, ...medley.trechos, ...medley.trechos] }
    expect(capasDoItem(cheio)).toHaveLength(4)
  })
})

describe('videosDoRepertorio', () => {
  it('leva os vídeos na ordem, com o Medley aberto trecho a trecho', () => {
    const itens: ItemApresentado[] = [
      { ...base, tipo: 'inteira', musicaId: 'a', tom: 'G', musica: resumo('aaa'), link: '' },
      { ...base, id: 'i2', tipo: 'trecho', musicaId: 'b', tom: 'C', inicio: '1:00', fim: '2:00', musica: resumo('bbb'), link: '' },
      {
        ...base,
        id: 'i3',
        tipo: 'medley',
        trechos: [
          { musicaId: 'c', tom: 'D', inicio: '0:00', fim: '1:00', musica: resumo('ccc'), link: '' },
          { musicaId: 'd', tom: 'E', inicio: '0:00', fim: '1:00', musica: resumo('ddd'), link: '' },
        ],
      },
    ]

    expect(videosDoRepertorio(itens)).toEqual(['aaa', 'bbb', 'ccc', 'ddd'])
  })

  it('devolve nada quando não há Item', () => {
    expect(videosDoRepertorio([])).toEqual([])
  })
})

const base = { id: 'i1', observacao: '', ministradoPor: null, descricao: '' }

function resumo(videoId: string) {
  return { id: videoId, titulo: 'Música', artista: 'Artista', videoId, capa: '', capaAlternativa: '' }
}
