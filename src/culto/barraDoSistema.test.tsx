import { afterEach, describe, expect, it } from 'vitest'
import { escurecerABarra } from './barraDoSistema'

afterEach(() => {
  document.head.querySelector('meta[name="theme-color"]')?.remove()
})

function metaDaBarra(cor: string): HTMLMetaElement {
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  meta.content = cor
  document.head.append(meta)
  return meta
}

describe('barra do sistema no modo culto', () => {
  it('escurece a barra ao entrar e devolve a cor do tema ao sair', () => {
    const meta = metaDaBarra('#F4F4F2')

    const sair = escurecerABarra()
    expect(meta.content).toBe('#0F0F10')

    sair()
    expect(meta.content).toBe('#F4F4F2')
  })

  it('não quebra sem a meta na página', () => {
    expect(() => escurecerABarra()()).not.toThrow()
  })
})
