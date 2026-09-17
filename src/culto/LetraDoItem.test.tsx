import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EscalaDoCulto, ItemDoCulto, MusicaDoCulto } from '../api/tipos'
import { LetraDoItem } from './LetraDoItem'
import type { Culto } from './ModoCulto'

const CATALOGO: MusicaDoCulto[] = [
  {
    id: 'rio',
    titulo: 'Rio',
    artista: 'Nívea Soares',
    tom: { valor: 'G', origem: 'execucao', data: '2026-08-24', ministradoPorNome: 'Isa' },
    vezesTocada: 3,
    letra: { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] }] },
  },
  { id: 'dono', titulo: 'Dono do Mundo', artista: 'Renovo', tom: null, vezesTocada: 0, letra: null },
  { id: 'sublime', titulo: 'Sublime', artista: 'fhop music', tom: null, vezesTocada: 1, letra: null },
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
    observacao: 'Começar mais baixo, só piano',
  },
  {
    id: 'i2',
    tipo: 'inteira',
    musicaId: 'dono',
    titulo: 'Dono do Mundo',
    artista: 'Renovo',
    tom: 'G',
    inicio: null,
    fim: null,
    observacao: '',
  },
  {
    id: 'i3',
    tipo: 'medley',
    observacao: '',
    letra: null,
    trechos: [{ musicaId: 'rio', titulo: 'Rio', artista: 'Nívea Soares', tom: 'E', inicio: '0:00', fim: '2:30' }],
  },
]

const ESCALA: EscalaDoCulto = {
  id: 'e1',
  data: '2026-09-20',
  horario: '18:00',
  titulo: 'Culto de Domingo 18h',
  itens: ITENS,
}

function mostrar(itemId: string) {
  const culto: Culto = {
    escala: ESCALA,
    catalogo: CATALOGO,
    atualizadoEm: null,
    velho: false,
    erroAoAtualizar: null,
  }

  return render(
    <MemoryRouter initialEntries={[`/culto/e1/item/${itemId}`]}>
      <Routes>
        <Route path="/culto/:escalaId" element={<Outlet context={culto} />}>
          <Route path="item/:itemId" element={<LetraDoItem />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function deslizar(de: number, para: number, altura = 0) {
  const corpo = document.querySelector('.rolagem')!

  fireEvent.touchStart(corpo, { touches: [{ clientX: de, clientY: 100 }] })
  fireEvent.touchEnd(corpo, { changedTouches: [{ clientX: para, clientY: 100 + altura }] })
}

describe('letra do Item no modo culto', () => {
  it('mostra tom, último tom, observação e a letra da Música', () => {
    mostrar('i1')

    expect(screen.getByText('1 de 3')).not.toBeNull()
    expect(screen.getByText('D')).not.toBeNull()
    expect(screen.getByText('último: G · Isa, 24/08')).not.toBeNull()
    expect(screen.getByText('Começar mais baixo, só piano')).not.toBeNull()
    expect(screen.getByText('E me mostrou um rio')).not.toBeNull()
  })

  it('avisa quando a Música ainda não tem letra', () => {
    mostrar('i2')

    expect(screen.getByText('Sem letra ainda')).not.toBeNull()
  })

  it('desabilita os botões nas pontas da ordem', () => {
    const { unmount } = mostrar('i1')

    expect(screen.getByText('‹ Início').closest('button')?.disabled).toBe(true)
    expect(screen.getByText('Dono do Mundo ›').closest('button')?.disabled).toBe(false)

    unmount()
    mostrar('i3')

    expect(screen.getByText('Fim ›').closest('button')?.disabled).toBe(true)
  })

  it('troca de música pelo rodapé', () => {
    mostrar('i1')

    fireEvent.click(screen.getByText('Dono do Mundo ›'))

    expect(screen.getByText('2 de 3')).not.toBeNull()
  })

  it('deslizar pro lado vai pra seguinte e pra anterior', () => {
    mostrar('i1')

    deslizar(280, 100)
    expect(screen.getByText('2 de 3')).not.toBeNull()

    deslizar(100, 280)
    expect(screen.getByText('1 de 3')).not.toBeNull()
  })

  it('não troca no deslize curto nem no que desce mais do que anda pro lado', () => {
    mostrar('i1')

    deslizar(140, 100)
    expect(screen.getByText('1 de 3')).not.toBeNull()

    deslizar(280, 100, 300)
    expect(screen.getByText('1 de 3')).not.toBeNull()
  })

  it('não sai da última ao deslizar pra frente', () => {
    mostrar('i3')

    deslizar(280, 100)

    expect(screen.getByText('3 de 3')).not.toBeNull()
  })
})
