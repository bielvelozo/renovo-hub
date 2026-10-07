import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotaDoTom } from './NotaDoTom'

describe('nota do Tom no palco', () => {
  it('mostra a nota grande, sem selo', () => {
    render(<NotaDoTom tom="D" tamanho="grande" />)

    expect(screen.getByText('D').className).toBe('nota display grande')
    expect(screen.queryByText('original')).toBeNull()
  })

  it('junta o selo «original» à nota resolvida', () => {
    render(<NotaDoTom tom="G" original />)

    expect(screen.getByText('G').className).toBe('nota display')
    expect(screen.getByText('original').className).toContain('selo')
  })

  it('escreve «Tom original» quando ninguém registrou a nota', () => {
    render(<NotaDoTom tom="original" original />)

    expect(screen.getByText('Tom original').className).toBe('nota-em-texto')
    expect(document.querySelector('.nota')).toBeNull()
  })
})
