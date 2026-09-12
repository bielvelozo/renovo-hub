import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MusicaResumida } from '../api/tipos'
import { Capa } from './Capa'

const musica = (id: string, extra: Partial<MusicaResumida> = {}): MusicaResumida => ({
  id,
  titulo: id,
  artista: 'Renovo',
  videoId: 'v' + id,
  capa: `https://img/${id}/maxres.jpg`,
  capaAlternativa: `https://img/${id}/hq.jpg`,
  ...extra,
})

describe('Capa', () => {
  it('é pequena por padrão e grande quando pedido', () => {
    const { container } = render(
      <>
        <Capa musicas={[musica('a')]} />
        <Capa musicas={[musica('b')]} tamanho="grande" />
      </>,
    )
    const [pequena, grande] = Array.from(container.querySelectorAll('.capa'))
    expect(pequena.className).toBe('capa')
    expect(grande.className).toBe('capa grande')
    expect(pequena.querySelector('img')?.getAttribute('loading')).toBe('lazy')
  })

  it('cai na capa alternativa e depois na nota musical', () => {
    const { container } = render(<Capa musicas={[musica('a')]} />)
    const img = container.querySelector('img')!

    fireEvent.error(img)
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://img/a/hq.jpg')

    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.capa-vazia svg')).not.toBeNull()
  })

  it('tocável vira link em nova aba com o play por cima', () => {
    render(<Capa musicas={[musica('a')]} tocavel="https://youtu.be/va" />)
    const link = screen.getByRole('link', { name: 'Tocar no YouTube' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.className).toBe('capa tocavel')
    expect(link.querySelector('.play svg')).not.toBeNull()
  })

  it('monta mosaico de até quatro', () => {
    const { container } = render(<Capa musicas={['a', 'b', 'c', 'd', 'e'].map((id) => musica(id))} />)
    const capa = container.querySelector('.capa')!
    expect(capa.className).toBe('capa colagem de-4')
    expect(capa.querySelectorAll('img').length).toBe(4)
  })
})
