import { describe, expect, it } from 'vitest'
import type { EscalaApresentada, ItemApresentado, MusicaResumida } from '../api/tipos'
import {
  capasDoItem,
  ministrosDaEscala,
  padraoDeQuemPuxa,
  resumoDoItem,
  situacaoDaEscala,
  textoDeQuemPuxa,
  tituloDoItem,
  videosDoRepertorio,
} from './repertorio'

const SEM_MEMORIA = { recente: false, ultimaExecucao: null, planejadaEm: [] }

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
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: 'Rio · Tom D',
  musicaId: 'rio',
  tom: 'D',
  musica: musica('rio', 'Rio'),
  link: 'https://youtu.be/v-rio',
  memoria: SEM_MEMORIA,
}

const trecho: ItemApresentado = {
  id: 'i2',
  tipo: 'trecho',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: 'Dono (1:05–2:30) · Tom F',
  musicaId: 'dono',
  tom: 'F',
  inicio: '1:05',
  fim: '2:30',
  musica: musica('dono', 'Dono da Minha Afeição'),
  link: 'https://youtu.be/v-dono?t=65',
  memoria: SEM_MEMORIA,
}

const medley: ItemApresentado = {
  id: 'i3',
  tipo: 'medley',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: 'Medley: Rio (0:10–1:00, Tom D) + Dono (1:05–2:30, Tom F)',
  memoria: null,
  trechos: [
    { musicaId: 'rio', tom: 'D', inicio: '0:10', fim: '1:00', musica: musica('rio', 'Rio'), link: 'x', memoria: SEM_MEMORIA },
    { musicaId: 'dono', tom: 'F', inicio: '1:05', fim: '2:30', musica: musica('dono', 'Dono'), link: 'y', memoria: SEM_MEMORIA },
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
      { ...base, tipo: 'inteira', musicaId: 'a', tom: 'G', musica: resumo('aaa'), link: '', memoria: SEM_MEMORIA },
      {
        ...base,
        id: 'i2',
        tipo: 'trecho',
        musicaId: 'b',
        tom: 'C',
        inicio: '1:00',
        fim: '2:00',
        musica: resumo('bbb'),
        link: '',
        memoria: SEM_MEMORIA,
      },
      {
        ...base,
        id: 'i3',
        tipo: 'medley',
        memoria: null,
        trechos: [
          { musicaId: 'c', tom: 'D', inicio: '0:00', fim: '1:00', musica: resumo('ccc'), link: '', memoria: SEM_MEMORIA },
          { musicaId: 'd', tom: 'E', inicio: '0:00', fim: '1:00', musica: resumo('ddd'), link: '', memoria: SEM_MEMORIA },
        ],
      },
    ]

    expect(videosDoRepertorio(itens)).toEqual(['aaa', 'bbb', 'ccc', 'ddd'])
  })

  it('devolve nada quando não há Item', () => {
    expect(videosDoRepertorio([])).toEqual([])
  })
})

const base = { id: 'i1', observacao: '', ministradoPor: null, ministradoPorNome: null, atualizadoEm: null, descricao: '' }

function resumo(videoId: string) {
  return { id: videoId, titulo: 'Música', artista: 'Artista', videoId, capa: '', capaAlternativa: '' }
}

const escala = (mudancas: Partial<EscalaApresentada> = {}): EscalaApresentada => ({
  id: 'e0913',
  data: '2026-09-13',
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [],
  itens: [inteira],
  estado: 'agendada',
  titulo: 'Culto de Domingo 18h',
  grupos: [],
  pessoas: [],
  resumoDoRepertorio: { recentes: 0, antigas: 0, nuncaTocadas: 0, total: 1 },
  pendencias: [],
  pronta: true,
  ...mudancas,
})

describe('situacaoDaEscala', () => {
  const gente = [
    { membroId: 'isa', nome: 'Isa', funcoes: ['Vocal'], ministro: true },
    { membroId: 'ana', nome: 'Ana', funcoes: ['Vocal'], ministro: false },
  ]

  it('diz equipe completa e músicas escolhidas, com as contagens ao lado', () => {
    expect(situacaoDaEscala(escala({ pessoas: gente }), true)).toEqual([
      { chave: 'equipe', texto: 'Equipe completa', detalhe: '2 pessoas', tom: 'sucesso' },
      { chave: 'musicas', texto: 'Músicas escolhidas', detalhe: '1 no repertório', tom: 'sucesso' },
    ])
  })

  it('troca a equipe completa pelo que falta nela e avisa do repertório vazio', () => {
    const comPendencias = escala({
      pronta: false,
      itens: [],
      pendencias: [
        { chave: 'sem-ministro', texto: 'sem ministro' },
        { chave: 'falta-funcao', texto: 'faltam 2 vocais', funcaoId: 'vocal' },
        { chave: 'sem-musicas', texto: 'sem músicas' },
      ],
    })

    expect(situacaoDaEscala(comPendencias, true).map((linha) => [linha.texto, linha.tom])).toEqual([
      ['Sem ministro', 'atencao'],
      ['Faltam 2 vocais', 'atencao'],
      ['Sem músicas ainda', 'atencao'],
    ])
  })

  it('não alerta de repetição recente: isso é assunto da hora de adicionar a música', () => {
    const comRepeticao = escala({ resumoDoRepertorio: { recentes: 1, antigas: 0, nuncaTocadas: 0, total: 1 } })

    expect(situacaoDaEscala(comRepeticao, true).every((linha) => linha.tom === 'sucesso')).toBe(true)
  })

  it('cala pro Membro e fora da Escala agendada', () => {
    expect(situacaoDaEscala(escala(), false)).toEqual([])
    expect(situacaoDaEscala(escala({ estado: 'realizada' }), true)).toEqual([])
    expect(situacaoDaEscala(escala({ estado: 'cancelada' }), true)).toEqual([])
  })
})

describe('quem puxa', () => {
  const isa = { membroId: 'isa', nome: 'Isa', funcoes: ['Vocal'], ministro: true }
  const marcos = { membroId: 'marcos', nome: 'Marcos', funcoes: ['Guitarra'], ministro: true }
  const ana = { membroId: 'ana', nome: 'Ana', funcoes: ['Vocal'], ministro: false }

  it('só aparece na linha quando a Escala tem mais de um Ministro', () => {
    const comMarca = { ...inteira, ministradoPor: 'isa', ministradoPorNome: 'Isa' }

    expect(textoDeQuemPuxa(comMarca, 2)).toBe('puxa: Isa')
    expect(textoDeQuemPuxa(comMarca, 1)).toBeNull()
    expect(textoDeQuemPuxa(inteira, 2)).toBeNull()
  })

  it('lista só os Ministros da Escala', () => {
    expect(ministrosDaEscala([isa, ana, marcos]).map((pessoa) => pessoa.nome)).toEqual(['Isa', 'Marcos'])
  })

  it('parte do último Item escolhido, ou do primeiro Ministro', () => {
    const itens = [
      { ...inteira, ministradoPor: 'isa', ministradoPorNome: 'Isa' },
      { ...trecho, ministradoPor: 'marcos', ministradoPorNome: 'Marcos' },
    ]

    expect(padraoDeQuemPuxa(escala({ pessoas: [isa, marcos], itens }))).toBe('marcos')
    expect(padraoDeQuemPuxa(escala({ pessoas: [isa], itens: [inteira] }))).toBe('isa')
    expect(padraoDeQuemPuxa(escala({ pessoas: [isa, marcos], itens: [inteira] }))).toBe('isa')
    expect(padraoDeQuemPuxa(escala({ pessoas: [ana], itens: [inteira] }))).toBeNull()
  })
})
