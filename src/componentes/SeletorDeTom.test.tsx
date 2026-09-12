import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SeletorDeTom } from './SeletorDeTom'

describe('SeletorDeTom', () => {
  it('marca a tecla do Tom original com o ponto e a sugerida com o outro', () => {
    render(<SeletorDeTom tom={null} sugerido="G" original="Em" escolher={() => {}} />)

    const sol = screen.getByRole('button', { name: 'G' })
    const mi = screen.getByRole('button', { name: 'E' })
    expect(sol.className).toBe('tecla sugerido')
    expect(mi.className).toBe('tecla original')
    expect(mi.getAttribute('data-original')).toBe('true')
  })

  it('escolhe o Tom com a qualidade atual ao tocar na tecla', () => {
    const escolher = vi.fn()
    render(<SeletorDeTom tom={null} sugerido="Bm" escolher={escolher} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dm' }))
    expect(escolher).toHaveBeenCalledWith('Dm')
  })
})
