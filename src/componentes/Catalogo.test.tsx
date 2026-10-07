import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { MusicaNaLista } from '../api/tipos'
import { CorpoDoCatalogo } from './Catalogo'

const HOJE = '2026-09-13'

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

const tocada = (data: string, ministradoPor: string | null = null) => ({
  escalaId: 'e' + data,
  data,
  tom: 'C',
  parcial: false,
  ministradoPor,
  ministradoPorNome: ministradoPor ? 'Isa' : null,
})

const CATALOGO = [
  musica('rio', 'Rio'),
  musica('dono', 'Dono da Minha Afeição'),
  musica('grato', 'Grato Sou'),
  musica('sublime', 'Sublime'),
  musica('meia', 'Meia Noite', { aba: 'recentes', secao: null, recente: true, ultimaExecucao: tocada('2026-09-06', 'isa') }),
  musica('firme', 'Firme', { aba: 'redescobrir', secao: 'paradas', ultimaExecucao: tocada('2025-01-10') }),
]

function montar(extra: Partial<Parameters<typeof CorpoDoCatalogo>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CorpoDoCatalogo modo="navegacao" euId="isa" musicas={CATALOGO} semanas={4} permiteYoutube={false} hoje={HOJE} {...extra} />
    </MemoryRouter>,
  )
}

const campo = () => screen.getByRole('searchbox', { name: 'Buscar ou colar um link' })

describe('Catalogo', () => {
  it('abre em Redescobrir com as contagens, e as três primeiras nunca tocadas com «ver todas»', () => {
    montar()

    const redescobrir = screen.getByRole('button', { name: /Redescobrir/ })
    expect(redescobrir.getAttribute('aria-pressed')).toBe('true')
    expect(redescobrir.textContent).toBe('Redescobrir5')
    expect(screen.getByRole('button', { name: /Recentes/ }).textContent).toBe('Recentes1')
    expect(screen.getByRole('button', { name: /^Todas/ }).textContent).toBe('Todas6')

    expect(screen.getByText('Sem histórico').textContent).toBe('Sem histórico 4')
    expect(screen.queryByText('Sublime')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ver todas as 4' }))
    expect(screen.getByText('Sublime')).not.toBeNull()
    expect(screen.getByText('Paradas há 3 meses ou mais')).not.toBeNull()
  })

  it('troca de aba e mantém a busca: digitar esconde o segmento, limpar volta na mesma aba', () => {
    montar()

    fireEvent.click(screen.getByRole('button', { name: /^Todas/ }))
    expect(screen.getByRole('navigation', { name: 'Índice de letras' })).not.toBeNull()

    fireEvent.change(campo(), { target: { value: 'meia' } })
    expect(screen.queryByRole('button', { name: /Redescobrir/ })).toBeNull()
    expect(screen.getByText('1 resultado')).not.toBeNull()
    expect(screen.getByText('Meia Noite')).not.toBeNull()
    expect(screen.queryByText('Rio')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))
    expect(screen.getByRole('button', { name: /^Todas/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('navigation', { name: 'Índice de letras' })).not.toBeNull()
  })

  it('Recentes mostra a zona de alerta com o tempo à direita e quem ministrou', () => {
    montar()

    fireEvent.click(screen.getByRole('button', { name: /Recentes/ }))
    expect(screen.getByText('Últimas 4 semanas').className).toContain('atencao')
    expect(screen.getByText('com Isa').className).toBe('selo atencao')
    expect(screen.getByText('há 7 dias').tagName).toBe('B')
  })

  it('só oferece o YouTube quando permitido', async () => {
    const buscarNoYoutube = vi.fn().mockResolvedValue([])
    const { unmount } = montar({ permiteYoutube: false })

    fireEvent.change(campo(), { target: { value: 'xyz' } })
    expect(screen.getByText('Nenhuma música com esse nome.')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /no YouTube/ })).toBeNull()
    unmount()

    montar({ permiteYoutube: true, modo: 'escolha', aoEscolher: vi.fn(), buscarNoYoutube })
    fireEvent.change(campo(), { target: { value: 'xyz' } })
    expect(screen.getByText('Nenhuma música com esse nome. Cole um link ou busque no YouTube.')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Buscar “xyz” no YouTube' }))
    await vi.waitFor(() => expect(buscarNoYoutube).toHaveBeenCalledWith('xyz'))
  })

  it('colar um link do YouTube resolve e entrega a escolha', async () => {
    const aoEscolher = vi.fn()
    const escolha = { musicaId: 'rio', link: null, resumo: CATALOGO[0] }
    const resolverLink = vi.fn().mockResolvedValue(escolha)
    montar({ permiteYoutube: true, modo: 'escolha', aoEscolher, resolverLink })

    fireEvent.change(campo(), { target: { value: 'https://youtu.be/s1oU-6vYc4E' } })
    await vi.waitFor(() => expect(aoEscolher).toHaveBeenCalledWith(escolha))
    expect(resolverLink).toHaveBeenCalledWith('https://youtu.be/s1oU-6vYc4E')
  })
})
