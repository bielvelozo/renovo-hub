import { describe, expect, it } from 'vitest'
import {
  CHAVE_DA_VELOCIDADE,
  CHAVE_DO_TAMANHO,
  PASSO_PADRAO,
  TAMANHOS_DA_LETRA,
  VELOCIDADE_MAXIMA,
  VELOCIDADE_MINIMA,
  VELOCIDADE_PADRAO,
  guardarPassoDaLetra,
  guardarVelocidade,
  lerPassoDaLetra,
  lerVelocidade,
  maisDevagar,
  maisRapido,
  passoAnterior,
  proximoPasso,
  pxPorSegundo,
  tamanhoDoPasso,
} from './leitura'
import type { Deposito } from './leitura'

function depositoFalso(inicial: Record<string, string> = {}): Deposito {
  const dados = new Map(Object.entries(inicial))

  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => void dados.set(chave, valor),
  }
}

function depositoQuebrado(): Deposito {
  return {
    getItem: () => {
      throw new Error('armazenamento bloqueado')
    },
    setItem: () => {
      throw new Error('quota cheia')
    },
  }
}

describe('tamanho da letra', () => {
  it('tem seis passos e começa nos 17 px de hoje', () => {
    expect(TAMANHOS_DA_LETRA).toEqual([15, 17, 19, 21, 23, 26])
    expect(tamanhoDoPasso(PASSO_PADRAO)).toBe(17)
  })

  it('anda para cima e para baixo', () => {
    expect(proximoPasso(1)).toBe(2)
    expect(passoAnterior(1)).toBe(0)
  })

  it('para nos limites', () => {
    expect(proximoPasso(TAMANHOS_DA_LETRA.length - 1)).toBe(TAMANHOS_DA_LETRA.length - 1)
    expect(passoAnterior(0)).toBe(0)
  })

  it('devolve o tamanho do passo, mesmo fora da faixa', () => {
    expect(tamanhoDoPasso(0)).toBe(15)
    expect(tamanhoDoPasso(5)).toBe(26)
    expect(tamanhoDoPasso(9)).toBe(26)
    expect(tamanhoDoPasso(-2)).toBe(15)
  })
})

describe('velocidade da rolagem', () => {
  it('vai de 1 a 5 e começa em 2', () => {
    expect(VELOCIDADE_MINIMA).toBe(1)
    expect(VELOCIDADE_MAXIMA).toBe(5)
    expect(VELOCIDADE_PADRAO).toBe(2)
  })

  it('anda e para nos limites', () => {
    expect(maisRapido(2)).toBe(3)
    expect(maisDevagar(2)).toBe(1)
    expect(maisRapido(VELOCIDADE_MAXIMA)).toBe(VELOCIDADE_MAXIMA)
    expect(maisDevagar(VELOCIDADE_MINIMA)).toBe(VELOCIDADE_MINIMA)
  })

  it('cresce junto com a velocidade', () => {
    expect(pxPorSegundo(1)).toBeGreaterThan(0)
    expect(pxPorSegundo(2)).toBe(2 * pxPorSegundo(1))
    expect(pxPorSegundo(5)).toBe(5 * pxPorSegundo(1))
  })

  it('leva mais de dois minutos numa letra de 60 linhas na velocidade padrão', () => {
    const rolagemDe60Linhas = 1200
    const segundos = rolagemDe60Linhas / pxPorSegundo(VELOCIDADE_PADRAO)

    expect(segundos).toBeGreaterThan(120)
    expect(segundos).toBeLessThan(240)
  })
})

describe('preferências guardadas no aparelho', () => {
  it('guarda e lê o passo do tamanho', () => {
    const deposito = depositoFalso()

    guardarPassoDaLetra(4, deposito)

    expect(deposito.getItem(CHAVE_DO_TAMANHO)).toBe('4')
    expect(lerPassoDaLetra(deposito)).toBe(4)
  })

  it('guarda e lê a velocidade', () => {
    const deposito = depositoFalso()

    guardarVelocidade(5, deposito)

    expect(deposito.getItem(CHAVE_DA_VELOCIDADE)).toBe('5')
    expect(lerVelocidade(deposito)).toBe(5)
  })

  it('cai no padrão sem nada guardado', () => {
    const deposito = depositoFalso()

    expect(lerPassoDaLetra(deposito)).toBe(PASSO_PADRAO)
    expect(lerVelocidade(deposito)).toBe(VELOCIDADE_PADRAO)
  })

  it('cai no padrão com lixo guardado', () => {
    const deposito = depositoFalso({ [CHAVE_DO_TAMANHO]: 'grande', [CHAVE_DA_VELOCIDADE]: '99' })

    expect(lerPassoDaLetra(deposito)).toBe(PASSO_PADRAO)
    expect(lerVelocidade(deposito)).toBe(VELOCIDADE_PADRAO)
  })

  it('não quebra com armazenamento bloqueado', () => {
    const deposito = depositoQuebrado()

    expect(() => guardarPassoDaLetra(3, deposito)).not.toThrow()
    expect(() => guardarVelocidade(3, deposito)).not.toThrow()
    expect(lerPassoDaLetra(deposito)).toBe(PASSO_PADRAO)
    expect(lerVelocidade(deposito)).toBe(VELOCIDADE_PADRAO)
  })
})
