import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { ProvedorDoEu } from '../sessao/sessao'
import { marcarVisitaNaEscala } from '../escalas/visita'
import { CartaoPosCulto, CultoDeHoje, RepertorioDoInicio } from './Inicio'

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

const mostrar = (elemento: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ProvedorDeAvisos>{elemento}</ProvedorDeAvisos>
    </MemoryRouter>,
  )

beforeEach(() => localStorage.clear())

describe('cartão pós-culto', () => {
  const posCulto = { escalaId: 'e0913', titulo: 'Culto de Domingo 18h', data: HOJE, itens: 5 }

  it('fecha por aparelho e não volta na abertura seguinte', () => {
    const { unmount } = mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.getByText('Hoje: 5 músicas no histórico')).not.toBeNull()

    fireEvent.click(screen.getByLabelText('Fechar'))
    expect(screen.queryByText('Hoje: 5 músicas no histórico')).toBeNull()

    unmount()
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.queryByText('Hoje: 5 músicas no histórico')).toBeNull()
  })

  it('fechar dá pra desfazer, e desfazer traz o cartão de volta pra sempre', () => {
    const { unmount } = mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    fireEvent.click(screen.getByLabelText('Fechar'))
    expect(screen.queryByText('Hoje: 5 músicas no histórico')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(screen.getByText('Hoje: 5 músicas no histórico')).not.toBeNull()

    unmount()
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.getByText('Hoje: 5 músicas no histórico')).not.toBeNull()
  })

  it('o título do cartão é um heading, pra quem navega por cabeçalhos', () => {
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Hoje: 5 músicas no histórico' })).not.toBeNull()
  })

  it('continua aparecendo nas outras Escalas', () => {
    mostrar(<CartaoPosCulto posCulto={posCulto} hoje={HOJE} />)
    fireEvent.click(screen.getByLabelText('Fechar'))

    mostrar(<CartaoPosCulto posCulto={{ ...posCulto, escalaId: 'e0920', itens: 1 }} hoje={HOJE} />)

    expect(screen.getByText('Hoje: 1 música no histórico')).not.toBeNull()
  })
})

describe('atalho do culto de hoje', () => {
  it('no dia da Escala é o mesmo atalho da tela de Escala, com o horário de hoje', () => {
    mostrar(<CultoDeHoje escala={escala([item('i1', null), item('i2', null)])} hoje={HOJE} />)

    const atalho = screen.getByRole('link', { name: /Abrir o modo culto/ })
    expect(atalho.getAttribute('href')).toBe('/culto/e0913')
    expect(atalho.className).toBe('atalho-do-culto')
    expect(screen.getByText('Hoje às 18h · letras e tons, sem internet')).not.toBeNull()
  })

  it('some quando a Escala mostrada não é a de hoje', () => {
    mostrar(<CultoDeHoje escala={escala([])} hoje="2026-09-12" />)

    expect(screen.queryByText('Abrir o modo culto')).toBeNull()
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

  it('quem dirige ganha Adicionar música no fim da lista; o Membro não', () => {
    const eu = { id: 'marcos', nome: 'Marcos', funcoes: [], ministro: true, admin: false, inativo: false, silenciado: false }
    const { unmount } = mostrar(
      <ProvedorDoEu eu={eu}>
        <RepertorioDoInicio escala={repertorio} anexosPorDono={{}} hoje={HOJE} />
      </ProvedorDoEu>,
    )

    expect(screen.getByRole('link', { name: 'Adicionar música' }).getAttribute('href')).toBe('/escalas/e0913/adicionar')

    unmount()
    mostrar(
      <ProvedorDoEu eu={{ ...eu, ministro: false }}>
        <RepertorioDoInicio escala={repertorio} anexosPorDono={{}} hoje={HOJE} />
      </ProvedorDoEu>,
    )

    expect(screen.queryByRole('link', { name: 'Adicionar música' })).toBeNull()
  })

  it('chama a seção só de Repertório, porque a data já está no cartão de cima, e cala quando não há música', () => {
    mostrar(<RepertorioDoInicio escala={escala([])} anexosPorDono={{}} hoje={HOJE} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Repertório' })).not.toBeNull()
    expect(screen.getByText('O Ministro ainda não escolheu as músicas.')).not.toBeNull()
    expect(screen.queryByText('Ouvir tudo')).toBeNull()
  })
})
