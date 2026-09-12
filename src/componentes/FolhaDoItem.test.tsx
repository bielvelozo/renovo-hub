import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { EscalaApresentada, ItemApresentado, MusicaDetalhada } from '../api/tipos'
import { CorpoDaFolhaDoItem } from './FolhaDoItem'

const HOJE = '2026-09-13'

const musica = {
  id: 'rio',
  titulo: 'Rio',
  artista: 'Renovo',
  videoId: 'v-rio',
  capa: '',
  capaAlternativa: '',
}

const item: ItemApresentado = {
  id: 'i1',
  tipo: 'inteira',
  musicaId: 'rio',
  tom: 'G',
  musica,
  link: 'https://youtu.be/v-rio',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: 'Rio · Tom G',
  memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
}

const detalhada: MusicaDetalhada = {
  ...musica,
  legado: false,
  nova: false,
  arquivada: false,
  revisar: false,
  tomConhecido: 'G',
  tomOriginal: 'G',
  ultimaExecucao: null,
  aba: 'redescobrir',
  secao: 'nunca',
  recente: false,
  planejadaEm: [],
  vezesTocada: 0,
  vezesEm6Meses: 0,
  temLetra: false,
  link: 'https://youtu.be/v-rio',
  cifraClub: 'https://cifraclub.com.br',
  tomSugerido: null,
  historico: [],
  cobertura: null,
  coberturaDoMinisterio: { ja: [], nunca: [] },
  anexos: [],
}

const isa = { membroId: 'isa', nome: 'Isa', funcoes: ['Vocal'], ministro: true }
const marcos = { membroId: 'marcos', nome: 'Marcos', funcoes: ['Guitarra'], ministro: true }
const ana = { membroId: 'ana', nome: 'Ana', funcoes: ['Vocal'], ministro: false }

const escala = (pessoas: typeof isa[]): EscalaApresentada => ({
  id: 'e0913',
  data: HOJE,
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [],
  itens: [item],
  estado: 'agendada',
  titulo: 'Culto de Domingo 18h',
  grupos: [],
  pessoas,
  resumoDoRepertorio: { recentes: 0, antigas: 0, nuncaTocadas: 1, total: 1 },
  pendencias: [],
  pronta: true,
})

function mostrar(pessoas: typeof isa[], acoes: { salvar?: () => void; remover?: () => void; fechar?: () => void } = {}) {
  return render(
    <MemoryRouter>
      <CorpoDaFolhaDoItem
        escala={escala(pessoas)}
        item={item}
        musica={detalhada}
        ocupado={false}
        hoje={HOJE}
        fechar={acoes.fechar ?? vi.fn()}
        salvar={acoes.salvar ?? vi.fn()}
        remover={acoes.remover ?? vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('FolhaDoItem', () => {
  it('só mostra «Quem puxa» quando a Escala tem mais de um Ministro', () => {
    const { unmount } = mostrar([isa, ana])

    expect(screen.queryByText('Quem puxa')).toBeNull()

    unmount()
    mostrar([isa, marcos])

    expect(screen.getByText('Quem puxa')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Isa' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Marcos' })).not.toBeNull()
  })

  it('salva o Tom, o jeito e quem puxa num corpo só', () => {
    const salvar = vi.fn()
    mostrar([isa, marcos], { salvar })

    fireEvent.click(screen.getByRole('button', { name: 'Marcos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trecho' }))
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '1:05' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(salvar).toHaveBeenCalledWith({
      tipo: 'trecho',
      tom: 'G',
      observacao: '',
      ministradoPor: 'marcos',
      inicio: '1:05',
      fim: '2:30',
    })
  })

  it('remove pelo botão de perigo e fecha a folha', () => {
    const remover = vi.fn()
    const fechar = vi.fn()
    mostrar([isa], { remover, fechar })

    fireEvent.click(screen.getByRole('button', { name: 'Remover do repertório' }))

    expect(remover).toHaveBeenCalledTimes(1)
    expect(fechar).toHaveBeenCalledTimes(1)
  })
})
