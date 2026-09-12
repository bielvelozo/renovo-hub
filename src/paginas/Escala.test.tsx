import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { Equipe, Repertorio } from './Escala'

const HOJE = '2026-09-13'

const musica = (id: string, titulo: string) => ({
  id,
  titulo,
  artista: 'Renovo',
  videoId: 'v-' + id,
  capa: '',
  capaAlternativa: '',
})

const item = (id: string, musicaId: string, titulo: string): ItemApresentado => ({
  id,
  tipo: 'inteira',
  musicaId,
  tom: 'G',
  musica: musica(musicaId, titulo),
  link: 'https://youtu.be/v-' + musicaId,
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm: null,
  descricao: titulo,
  memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
})

const escala: EscalaApresentada = {
  id: 'e0913',
  data: HOJE,
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [],
  itens: [item('i1', 'rio', 'Rio'), item('i2', 'dono', 'Dono'), item('i3', 'graca', 'Graça')],
  estado: 'agendada',
  titulo: 'Culto de Domingo 18h',
  grupos: [],
  pessoas: [{ membroId: 'isa', nome: 'Isa', funcoes: ['Vocal'], ministro: true }],
  resumoDoRepertorio: { recentes: 1, antigas: 0, nuncaTocadas: 2, total: 3 },
  pendencias: [],
  pronta: true,
}

const acao = { ocupado: false, erro: null, executar: vi.fn(), limpar: vi.fn() }

function mostrar(mudar = vi.fn()) {
  render(
    <MemoryRouter>
      <ProvedorDeAvisos>
        <Repertorio
          escala={escala}
          dirige
          podeEditar
          acao={acao}
          mudar={mudar}
          definir={vi.fn()}
          hoje={HOJE}
          visita={null}
        />
      </ProvedorDeAvisos>
    </MemoryRouter>,
  )

  return mudar
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ ...musica('rio', 'Rio'), anexos: [], historico: [], planejadaEm: [] }),
    })),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('Repertório da Escala', () => {
  it('conta as músicas no título e resume o repertório embaixo', () => {
    mostrar()

    expect(screen.getByText('Repertório · 3 músicas')).not.toBeNull()
    expect(screen.getByText('1 recente · 2 nunca tocadas')).not.toBeNull()
  })

  it('remove pela folha do Item com desfazer, sem chamar o servidor na hora', async () => {
    const mudar = mostrar()

    fireEvent.click(screen.getByRole('button', { name: /2\. Dono/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remover do repertório' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Remover do repertório' }))

    expect(screen.queryByText(/Dono/)).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Música tirada da escala')
    expect(screen.getByRole('button', { name: 'Desfazer' })).not.toBeNull()
    expect(mudar).not.toHaveBeenCalled()

    // A linha sai da vista mas fica no DOM: a ordenação mede as linhas por posição.
    expect(document.querySelectorAll('.lista li')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))

    expect(screen.getByText(/Dono/)).not.toBeNull()
    expect(mudar).not.toHaveBeenCalled()
  })
})

describe('Equipe na tela da Escala', () => {
  const pessoa = (id: string, nome: string, ministro = false) => ({
    membroId: id,
    nome,
    funcoes: ['Vocal'],
    ministro,
  })

  it('marca você e o Ministro, e esconde do sétimo em diante até o toque', () => {
    const muita = {
      ...escala,
      pessoas: [
        pessoa('isa', 'Isa', true),
        pessoa('ana', 'Ana'),
        pessoa('bia', 'Bia'),
        pessoa('caio', 'Caio'),
        pessoa('davi', 'Davi'),
        pessoa('eva', 'Eva'),
        pessoa('gabriel', 'Gabriel'),
      ],
    }

    render(
      <MemoryRouter>
        <Equipe escala={muita} euId="ana" dirige />
      </MemoryRouter>,
    )

    expect(screen.getByText('você')).not.toBeNull()
    expect(screen.getByText('ministro')).not.toBeNull()
    expect(screen.queryByText('Gabriel')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /e mais 1/ }))

    expect(screen.getByText('Gabriel')).not.toBeNull()
  })

  it('diz que ninguém está escalado e chama o Montar', () => {
    render(
      <MemoryRouter>
        <Equipe escala={{ ...escala, pessoas: [] }} euId="ana" dirige />
      </MemoryRouter>,
    )

    expect(screen.getByText('Ninguém escalado ainda.')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Montar' })).not.toBeNull()
  })
})
