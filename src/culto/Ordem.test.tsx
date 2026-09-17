import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EscalaDoCulto, ItemDoCulto, MusicaDoCulto } from '../api/tipos'
import { hojeEmBrasilia } from '../dominio'
import type { Culto } from './ModoCulto'
import { Ordem } from './Ordem'

const CATALOGO: MusicaDoCulto[] = [
  {
    id: 'rio',
    titulo: 'Rio',
    artista: 'Nívea Soares',
    tom: null,
    vezesTocada: 3,
    letra: { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto: 'Um rio', forte: false }] }] },
  },
  { id: 'sublime', titulo: 'Sublime', artista: 'fhop music', tom: null, vezesTocada: 1, letra: null },
  { id: 'dono', titulo: 'Dono do Mundo', artista: 'Renovo', tom: null, vezesTocada: 0, letra: null },
]

const ITENS: ItemDoCulto[] = [
  {
    id: 'i1',
    tipo: 'inteira',
    musicaId: 'rio',
    titulo: 'Rio',
    artista: 'Nívea Soares',
    tom: 'D',
    inicio: null,
    fim: null,
    observacao: '',
  },
  {
    id: 'i2',
    tipo: 'inteira',
    musicaId: 'dono',
    titulo: 'Dono do Mundo',
    artista: 'Renovo',
    tom: 'original',
    inicio: null,
    fim: null,
    observacao: '',
  },
  {
    id: 'i3',
    tipo: 'medley',
    observacao: '',
    letra: null,
    trechos: [
      { musicaId: 'rio', titulo: 'Rio', artista: 'Nívea Soares', tom: 'D', inicio: '0:00', fim: '2:30' },
      { musicaId: 'sublime', titulo: 'Sublime', artista: 'fhop music', tom: 'original', inicio: '1:10', fim: '3:05' },
    ],
  },
]

function escalaCom(itens: ItemDoCulto[], data = hojeEmBrasilia()): EscalaDoCulto {
  return { id: 'e1', data, horario: '18:00', titulo: 'Culto de Domingo 18h', itens }
}

function mostrar(escala: EscalaDoCulto, extras: Partial<Culto> = {}) {
  const culto: Culto = {
    escala,
    catalogo: CATALOGO,
    atualizadoEm: null,
    velho: false,
    erroAoAtualizar: null,
    ...extras,
  }

  return render(
    <MemoryRouter initialEntries={['/culto/e1']}>
      <Routes>
        <Route path="/culto/:escalaId" element={<Outlet context={culto} />}>
          <Route index element={<Ordem />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ordem do culto', () => {
  it('mostra o culto, o título de hoje e a nota de cada Item', () => {
    mostrar(escalaCom(ITENS))

    expect(screen.getByText('Culto de Domingo · 18h')).not.toBeNull()
    expect(screen.getByText('Ordem de hoje')).not.toBeNull()
    expect(screen.getByText('D')).not.toBeNull()
    expect(screen.getByText('Nívea Soares · letra')).not.toBeNull()
  })

  it('troca a nota grande por selo quando o tom é o original', () => {
    mostrar(escalaCom(ITENS))

    expect(screen.getByText('tom original')).not.toBeNull()
    expect(screen.queryByText('original')).toBeNull()
  })

  it('junta os trechos do Medley com os tons abreviados', () => {
    mostrar(escalaCom(ITENS))

    expect(screen.getByText('Medley: Rio + Sublime')).not.toBeNull()
    expect(screen.getByText('2 trechos · letra')).not.toBeNull()
    expect(screen.getByText('D · orig.')).not.toBeNull()
  })

  it('nomeia a ordem pelo dia quando a Escala não é hoje', () => {
    mostrar(escalaCom(ITENS, '2099-09-20'))

    expect(screen.getByText('Ordem de dom, 20 de set de 2099')).not.toBeNull()
  })

  it('avisa quando o Ministro não escolheu as músicas', () => {
    mostrar(escalaCom([]))

    expect(screen.getByText('O Ministro ainda não escolheu as músicas')).not.toBeNull()
    expect(screen.getByText('Pesquisar música')).not.toBeNull()
  })

  it('conta que o pacote está velho e que não deu pra atualizar', () => {
    mostrar(escalaCom(ITENS), {
      atualizadoEm: '2026-09-12T17:00:00.000Z',
      velho: true,
      erroAoAtualizar: 'Sem conexão',
    })

    expect(screen.getByText('atualizado sáb, 14h')).not.toBeNull()
    expect(screen.getByText('Não consegui atualizar; mostrando o de sáb, 14h')).not.toBeNull()
  })
})
