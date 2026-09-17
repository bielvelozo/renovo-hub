import { describe, expect, it } from 'vitest'
import { chaveDoItem, temLetraNoItem } from './anexos'
import type { Anexo, ItemApresentado, MusicaResumida } from './tipos'

const resumida = (id: string): MusicaResumida => ({
  id,
  titulo: id,
  artista: 'Renovo',
  videoId: 'v-' + id,
  capa: '',
  capaAlternativa: '',
})

const anexo = (versao: number, temLetra: boolean): Anexo => ({
  id: 'a' + versao,
  musicaId: null,
  itemId: null,
  nome: 'Letra.docx',
  mime: '',
  tamanho: 1,
  temLetra,
  versao,
  criadoEm: '2026-09-12T12:00:00.000Z',
  url: '/api/anexos/a' + versao,
})

const inteira: ItemApresentado = {
  id: 'i1',
  tipo: 'inteira',
  musicaId: 'rio',
  tom: 'G',
  musica: resumida('rio'),
  link: '',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: '',
  memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
}

const medley: ItemApresentado = {
  id: 'i2',
  tipo: 'medley',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: '',
  memoria: null,
  trechos: [
    {
      musicaId: 'rio',
      tom: 'G',
      inicio: '0:00',
      fim: '1:00',
      musica: resumida('rio'),
      link: '',
      memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
    },
    {
      musicaId: 'sublime',
      tom: 'A',
      inicio: '1:00',
      fim: '2:00',
      musica: resumida('sublime'),
      link: '',
      memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
    },
  ],
}

describe('temLetraNoItem', () => {
  it('olha só o anexo mais novo da Música', () => {
    expect(temLetraNoItem(inteira, { rio: [anexo(2, true), anexo(1, false)] })).toBe(true)
    expect(temLetraNoItem(inteira, { rio: [anexo(2, false), anexo(1, true)] })).toBe(false)
    expect(temLetraNoItem(inteira, {})).toBe(false)
  })

  it('no Medley vale a letra do Item ou a de alguma das músicas', () => {
    expect(temLetraNoItem(medley, { [chaveDoItem('i2')]: [anexo(1, true)] })).toBe(true)
    expect(temLetraNoItem(medley, { sublime: [anexo(1, true)] })).toBe(true)
    expect(temLetraNoItem(medley, { [chaveDoItem('i2')]: [anexo(1, false)], rio: [anexo(1, false)] })).toBe(false)
    expect(temLetraNoItem(medley, {})).toBe(false)
  })
})
