import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { marcarVisitaNaEscala } from '../escalas/visita'
import { CartaoDoCulto, CartaoPosCulto, RepertorioDoInicio } from './Inicio'

const HOJE = '2026-09-13'

const musica = {
  id: 'rio',
  titulo: 'Rio',
  artista: 'Renovo',
  videoId: 'v-rio',
  capa: '',
  capaAlternativa: '',
}

const item = (id: string, atualizadoEm: string | null): ItemApresentado => ({
  id,
  tipo: 'inteira',
  musicaId: musica.id,
  tom: 'G',
  musica,
  link: 'https://youtu.be/v-rio',
  observacao: '',
  ministradoPor: null,
  ministradoPorNome: null,
  atualizadoEm,
  descricao: 'Rio',
  memoria: { recente: false, ultimaExecucao: null, planejadaEm: [] },
})

const escala = (itens: ItemApresentado[]): EscalaApresentada => ({
  id: 'e0913',
  data: HOJE,
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [],
  itens,
  estado: 'agendada',
  titulo: 'Culto de Domingo 18h',
  grupos: [],
  pessoas: [],
  resumoDoRepertorio: { recentes: 0, antigas: 0, nuncaTocadas: 0, total: 0 },
  pendencias: [],
  pronta: true,
})

const mostrar = (elemento: React.ReactElement) => render(<MemoryRouter>{elemento}</MemoryRouter>)

beforeEach(() => localStorage.clear())

describe('cartão pós-culto', () => {
  const posCulto = { escalaId: 'e0913', titulo: 'Culto de Domingo 18h', data: HOJE, itens: 5 }

  it('fecha por aparelho e não volta na abertura seguinte', () => {
    const { unmount } = mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.getByText('Hoje: 5 músicas registradas')).not.toBeNull()

    fireEvent.click(screen.getByLabelText('Fechar'))
    expect(screen.queryByText('Hoje: 5 músicas registradas')).toBeNull()

    unmount()
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.queryByText('Hoje: 5 músicas registradas')).toBeNull()
  })

  it('continua aparecendo nas outras Escalas', () => {
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)
    fireEvent.click(screen.getByLabelText('Fechar'))

    mostrar(<CartaoPosCulto posCulto={{ ...posCulto, escalaId: 'e0920', itens: 1 }} hoje={HOJE} />)

    expect(screen.getByText('Hoje: 1 música registrada')).not.toBeNull()
  })
})

describe('cartão do culto de hoje', () => {
  it('convida pro modo culto no dia da Escala, com as músicas e o horário', () => {
    mostrar(<CartaoDoCulto escala={escala([item('i1', null), item('i2', null)])} hoje={HOJE} />)

    expect(screen.getByText('Culto de hoje')).not.toBeNull()
    expect(screen.getByText('2 músicas · 18h')).not.toBeNull()
    expect(screen.getByText('Modo culto').closest('a')?.getAttribute('href')).toBe('/culto/e0913')
  })

  it('some quando a Escala mostrada não é a de hoje', () => {
    mostrar(<CartaoDoCulto escala={escala([])} hoje="2026-09-12" />)

    expect(screen.queryByText('Culto de hoje')).toBeNull()
  })
})

describe('marca «mudou» no Repertório do Início', () => {
  const repertorio = escala([item('i1', '2026-09-12T10:00:00.000Z')])

  it('aparece pra quem ainda não abriu a Escala', () => {
    mostrar(<RepertorioDoInicio escala={repertorio} anexosPorDono={{}} hoje={HOJE} />)

    expect(screen.getByText('mudou')).not.toBeNull()
  })

  it('some depois da visita, e volta quando o Item é editado de novo', () => {
    marcarVisitaNaEscala('e0913', new Date('2026-09-12T11:00:00.000Z'))
    const { unmount } = mostrar(<RepertorioDoInicio escala={repertorio} anexosPorDono={{}} hoje={HOJE} />)

    expect(screen.queryByText('mudou')).toBeNull()

    unmount()
    mostrar(<RepertorioDoInicio escala={escala([item('i1', '2026-09-12T12:00:00.000Z')])} anexosPorDono={{}} hoje={HOJE} />)

    expect(screen.getByText('mudou')).not.toBeNull()
  })

  it('nomeia o Repertório pelo dia da semana da Escala e cala quando não há música', () => {
    mostrar(<RepertorioDoInicio escala={escala([])} anexosPorDono={{}} hoje={HOJE} />)

    expect(screen.getByText('Repertório · domingo')).not.toBeNull()
    expect(screen.getByText('O Ministro ainda não escolheu as músicas.')).not.toBeNull()
    expect(screen.queryByText('Ouvir tudo')).toBeNull()
  })
})
