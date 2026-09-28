import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Rosto } from './Rosto'

describe('Rosto', () => {
  it('mostra a inicial de quem não tem foto', () => {
    const { container } = render(<Rosto membroId="ana" nome="ana" foto={null} />)

    expect(container.textContent).toBe('A')
    expect(container.querySelector('img')).toBeNull()
  })

  it('mostra a foto pela URL com a versão', () => {
    const { container } = render(<Rosto membroId="ana" nome="Ana" foto="2026-09-28T10:00:00.000Z" tamanho="mini" />)

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/api/membros/ana/foto?v=2026-09-28T10%3A00%3A00.000Z',
    )
    expect(container.firstElementChild?.className).toBe('inicial mini')
  })

  it('volta para a inicial quando a foto não carrega', () => {
    const { container } = render(<Rosto membroId="ana" nome="Ana" foto="v1" />)

    fireEvent.error(container.querySelector('img')!)

    expect(container.textContent).toBe('A')
  })
})
