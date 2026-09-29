import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { BarraDeLeitura } from './BarraDeLeitura'
import { CHAVE_DA_VELOCIDADE, CHAVE_DO_TAMANHO } from './leitura'

function tamanhoAplicado(): string {
  return document.documentElement.style.getPropertyValue('--tamanho-da-letra')
}

function botao(rotulo: string): HTMLButtonElement {
  return screen.getByLabelText(rotulo) as HTMLButtonElement
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.style.removeProperty('--tamanho-da-letra')
})

describe('tamanho da letra na barra de leitura', () => {
  it('começa nos 17 px', () => {
    render(<BarraDeLeitura />)

    expect(tamanhoAplicado()).toBe('17px')
  })

  it('aumenta a letra e guarda no aparelho', () => {
    render(<BarraDeLeitura />)

    fireEvent.click(botao('Aumentar a letra'))

    expect(tamanhoAplicado()).toBe('19px')
    expect(localStorage.getItem(CHAVE_DO_TAMANHO)).toBe('2')
  })

  it('diminui a letra', () => {
    render(<BarraDeLeitura />)

    fireEvent.click(botao('Diminuir a letra'))

    expect(tamanhoAplicado()).toBe('15px')
  })

  it('volta com o tamanho guardado', () => {
    localStorage.setItem(CHAVE_DO_TAMANHO, '5')

    render(<BarraDeLeitura />)

    expect(tamanhoAplicado()).toBe('26px')
  })

  it('desabilita nos limites', () => {
    localStorage.setItem(CHAVE_DO_TAMANHO, '0')
    const menor = render(<BarraDeLeitura />)

    expect(botao('Diminuir a letra').disabled).toBe(true)
    expect(botao('Aumentar a letra').disabled).toBe(false)

    menor.unmount()
    localStorage.setItem(CHAVE_DO_TAMANHO, '7')
    render(<BarraDeLeitura />)

    expect(botao('Aumentar a letra').disabled).toBe(true)
    expect(botao('Diminuir a letra').disabled).toBe(false)
  })
})

describe('rolagem automática na barra de leitura', () => {
  it('alterna entre rolar e parar', () => {
    render(<BarraDeLeitura />)
    const rolar = screen.getByText('Rolar').closest('button') as HTMLButtonElement

    expect(rolar.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(rolar)

    const parar = screen.getByText('Parar').closest('button') as HTMLButtonElement
    expect(parar.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(parar)

    expect(screen.getByText('Rolar')).toBeTruthy()
  })

  it('a velocidade só aparece enquanto rola', () => {
    render(<BarraDeLeitura />)

    expect(screen.queryByLabelText('Velocidade da rolagem')).toBeNull()

    fireEvent.click(screen.getByText('Rolar'))
    expect(screen.getByLabelText('Velocidade da rolagem')).not.toBeNull()

    fireEvent.click(screen.getByText('Parar'))
    expect(screen.queryByLabelText('Velocidade da rolagem')).toBeNull()
  })

  it('esconde Rolar quando a letra cabe na tela, e mostra quando sobra', () => {
    const caixa = document.createElement('div')
    caixa.style.overflowY = 'auto'
    Object.defineProperty(caixa, 'clientHeight', { value: 800, configurable: true })
    Object.defineProperty(caixa, 'scrollHeight', { value: 500, configurable: true })
    document.body.append(caixa)

    const cabe = render(<BarraDeLeitura rolagem={{ current: caixa }} />)
    expect(screen.queryByText('Rolar')).toBeNull()
    expect(screen.getByLabelText('Aumentar a letra')).not.toBeNull()
    cabe.unmount()

    Object.defineProperty(caixa, 'scrollHeight', { value: 2000, configurable: true })
    render(<BarraDeLeitura rolagem={{ current: caixa }} />)
    expect(screen.getByText('Rolar')).not.toBeNull()
    caixa.remove()
  })

  it('começa na velocidade 2 e muda com os botões', () => {
    render(<BarraDeLeitura />)
    fireEvent.click(screen.getByText('Rolar'))

    expect(screen.getByLabelText('Velocidade da rolagem').textContent).toBe('2')

    fireEvent.click(botao('Mais rápido'))

    expect(screen.getByLabelText('Velocidade da rolagem').textContent).toBe('3')
    expect(localStorage.getItem(CHAVE_DA_VELOCIDADE)).toBe('3')

    fireEvent.click(botao('Mais devagar'))

    expect(screen.getByLabelText('Velocidade da rolagem').textContent).toBe('2')
  })

  it('volta com a velocidade guardada e desabilita nos limites', () => {
    localStorage.setItem(CHAVE_DA_VELOCIDADE, '5')
    const rapida = render(<BarraDeLeitura />)
    fireEvent.click(screen.getByText('Rolar'))

    expect(screen.getByLabelText('Velocidade da rolagem').textContent).toBe('5')
    expect(botao('Mais rápido').disabled).toBe(true)
    expect(botao('Mais devagar').disabled).toBe(false)

    rapida.unmount()
    localStorage.setItem(CHAVE_DA_VELOCIDADE, '1')
    render(<BarraDeLeitura />)
    fireEvent.click(screen.getByText('Rolar'))

    expect(botao('Mais devagar').disabled).toBe(true)
    expect(botao('Mais rápido').disabled).toBe(false)
  })
})
