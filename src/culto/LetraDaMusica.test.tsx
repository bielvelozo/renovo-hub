import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { EscalaDoCulto, MusicaDoCulto } from '../api/tipos'
import { LetraDaMusica } from './LetraDaMusica'
import type { Culto } from './ModoCulto'

const CATALOGO: MusicaDoCulto[] = [
  {
    id: 'rio',
    titulo: 'Rio',
    artista: 'Nívea Soares',
    tom: { valor: 'G', origem: 'conhecido' },
    vezesTocada: 3,
    letra: { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] }] },
  },
  {
    id: 'dono',
    titulo: 'Dono do Mundo',
    artista: 'Renovo',
    tom: { valor: 'C', origem: 'conhecido' },
    vezesTocada: 0,
    letra: null,
  },
  { id: 'sublime', titulo: 'Sublime', artista: 'fhop music', tom: null, vezesTocada: 1, letra: null },
]

const ESCALA: EscalaDoCulto = {
  id: 'e1',
  data: '2026-09-20',
  horario: '18:00',
  titulo: 'Culto de Domingo 18h',
  itens: [],
}

function mostrar(musicaId: string) {
  const culto: Culto = {
    escala: ESCALA,
    catalogo: CATALOGO,
    atualizadoEm: null,
    velho: false,
    erroAoAtualizar: null,
  }

  return render(
    <MemoryRouter initialEntries={[`/culto/e1/musica/${musicaId}`]}>
      <Routes>
        <Route path="/culto/:escalaId" element={<Outlet context={culto} />}>
          <Route path="musica/:musicaId" element={<LetraDaMusica />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('letra da Música pesquisada no culto', () => {
  it('com letra, o Tom fica no cabeçalho e a letra no corpo', () => {
    mostrar('rio')

    expect(document.querySelector('.cabecalho-da-letra .nota.grande')?.textContent).toBe('G')
    expect(screen.getByText('E me mostrou um rio')).not.toBeNull()
    expect(document.querySelector('.nota.palco')).toBeNull()
  })

  it('sem letra, o Tom toma o palco', () => {
    mostrar('dono')

    expect(document.querySelector('.rolagem .nota.palco')?.textContent).toBe('C')
    expect(document.querySelector('.cabecalho-da-letra .nota')).toBeNull()
    expect(screen.getByText('Sem letra ainda')).not.toBeNull()
  })

  it('sem letra e sem tom, avisa no cabeçalho que não há tom', () => {
    mostrar('sublime')

    expect(screen.getByText('sem tom')).not.toBeNull()
    expect(document.querySelector('.nota.palco')).toBeNull()
  })
})
