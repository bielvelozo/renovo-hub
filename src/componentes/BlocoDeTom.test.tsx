import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BuscaNoCifraClub } from './BlocoDeTom'

const musica = { titulo: 'Rio', artista: 'Nívea Soares' }

function responder(corpo: unknown) {
  const caminhos: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string) => {
      caminhos.push(caminho)
      return { ok: true, status: 200, headers: new Headers(), json: async () => corpo }
    }),
  )
  return caminhos
}

afterEach(() => vi.unstubAllGlobals())

describe('BuscaNoCifraClub', () => {
  it('mostra a cifra achada com o link pra ver o tom lá', async () => {
    const caminhos = responder({
      achado: { titulo: 'Rio', artista: 'Nívea Soares', url: 'https://www.cifraclub.com.br/nivea-soares/rio/' },
    })

    render(<BuscaNoCifraClub musica={musica} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buscar no Cifra Club' }))

    expect(await screen.findByText('Rio · Nívea Soares')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Abrir a cifra' }).getAttribute('href')).toBe(
      'https://www.cifraclub.com.br/nivea-soares/rio/',
    )
    expect(caminhos[0]).toBe('/api/cifraclub?termo=Rio&artista=N%C3%ADvea+Soares')
  })

  it('troca o achado pela busca do site quando não é essa', async () => {
    responder({ achado: { titulo: 'Rio', artista: 'Outro', url: 'https://www.cifraclub.com.br/outro/rio/' } })

    render(<BuscaNoCifraClub musica={musica} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buscar no Cifra Club' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Não é essa' }))

    expect(screen.queryByRole('link', { name: 'Abrir a cifra' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Procurar no Cifra Club' }).getAttribute('href')).toBe(
      'https://www.cifraclub.com.br/?q=Rio',
    )
  })

  it('manda procurar no site quando a busca não acha a música', async () => {
    responder({ achado: null })

    render(<BuscaNoCifraClub musica={musica} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buscar no Cifra Club' }))

    expect(await screen.findByText(/não achou a cifra desta música/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Procurar no Cifra Club' })).toBeTruthy()
  })
})
