import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
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
    original: false,
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
    tom: 'G',
    original: true,
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
      { musicaId: 'rio', titulo: 'Rio', artista: 'Nívea Soares', tom: 'D', original: false, inicio: '0:00', fim: '2:30' },
      {
        musicaId: 'sublime',
        titulo: 'Sublime',
        artista: 'fhop music',
        tom: 'original',
        original: true,
        inicio: '1:10',
        fim: '3:05',
      },
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
    baixando: false,
    atualizar: () => {},
    telaAcesa: false,
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

  it('mostra a nota resolvida do tom original em grande, com o selo «original» embaixo', () => {
    mostrar(escalaCom(ITENS))

    expect(document.querySelector('.nota-com-selo .nota')?.textContent).toBe('G')
    expect(screen.getByText('original').className).toContain('selo')
    expect(screen.queryByText('tom original')).toBeNull()
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

  it('sem internet e com pacote recente, segue tranquilo: guardado no aparelho e a hora da atualização', () => {
    mostrar(escalaCom(ITENS), { atualizadoEm: '2026-09-12T17:00:00.000Z', erroAoAtualizar: 'Sem conexão' })

    expect(screen.getByText('Guardado no aparelho · atualizado sáb, 14h')).not.toBeNull()
    expect(screen.queryByText(/Não consegui atualizar/)).toBeNull()
  })

  it('só alerta quando o pacote está velho e não deu pra atualizar', () => {
    mostrar(escalaCom(ITENS), {
      atualizadoEm: '2026-09-12T17:00:00.000Z',
      velho: true,
      erroAoAtualizar: 'Sem conexão',
    })

    expect(screen.getByText('Não consegui atualizar; mostrando o de sáb, 14h')).not.toBeNull()
    expect(screen.queryByText(/Guardado no aparelho/)).toBeNull()
  })

  it('deixa atualizar o pacote na hora', () => {
    const atualizar = vi.fn()
    mostrar(escalaCom(ITENS), { atualizadoEm: '2026-09-12T17:00:00.000Z', atualizar })

    fireEvent.click(screen.getByText('Atualizar'))

    expect(atualizar).toHaveBeenCalledOnce()
  })

  it('explica o deslize e só promete a tela acesa quando segura a trava', () => {
    const acesa = mostrar(escalaCom(ITENS), { telaAcesa: true })

    expect(screen.getByText(/deslize para o lado/)).not.toBeNull()
    expect(screen.getByText(/A tela fica acesa/)).not.toBeNull()

    acesa.unmount()
    mostrar(escalaCom(ITENS))

    expect(screen.getByText(/deslize para o lado/)).not.toBeNull()
    expect(screen.queryByText(/A tela fica acesa/)).toBeNull()
  })
})
