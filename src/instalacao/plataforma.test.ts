import { describe, expect, it } from 'vitest'
import { PLATAFORMAS, passosDeInstalacao, plataformaDoAgente } from './plataforma'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPAD_QUE_MENTE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

describe('plataformaDoAgente', () => {
  it('reconhece iPhone e iPad', () => {
    expect(plataformaDoAgente(IPHONE, false)).toBe('ios')
    expect(plataformaDoAgente(IPAD, false)).toBe('ios')
  })

  it('reconhece o iPad que se diz Mac pelo toque na tela', () => {
    expect(plataformaDoAgente(IPAD_QUE_MENTE, true)).toBe('ios')
    expect(plataformaDoAgente(IPAD_QUE_MENTE, false)).toBe('outra')
  })

  it('reconhece Android', () => {
    expect(plataformaDoAgente(ANDROID, false)).toBe('android')
  })

  it('computador é outra', () => {
    expect(plataformaDoAgente(WINDOWS, false)).toBe('outra')
    expect(plataformaDoAgente('', false)).toBe('outra')
  })
})

describe('passosDeInstalacao', () => {
  it('cada plataforma tem aba, título e passos em PT-BR', () => {
    expect(PLATAFORMAS).toEqual(['ios', 'android', 'outra'])

    for (const plataforma of PLATAFORMAS) {
      const { aba, titulo, passos } = passosDeInstalacao(plataforma)
      expect(aba.length).toBeGreaterThan(0)
      expect(titulo.length).toBeGreaterThan(0)
      expect(passos.length).toBeGreaterThan(0)
    }
  })

  it('o passo do iPhone é Compartilhar e Adicionar à Tela de Início', () => {
    expect(passosDeInstalacao('ios').passos.join(' ')).toContain('Adicionar à Tela de Início')
  })

  it('o passo do Android é instalar pelo menu', () => {
    expect(passosDeInstalacao('android').passos.join(' ')).toContain('Instalar app')
  })
})
