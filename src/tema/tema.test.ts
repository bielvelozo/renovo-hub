import { describe, expect, it } from 'vitest'
import { lerPreferencia, proximaPreferencia, rotuloDaPreferencia, temaEfetivo } from './tema'

describe('lerPreferencia', () => {
  it('aceita as três preferências guardadas', () => {
    expect(lerPreferencia('automatico')).toBe('automatico')
    expect(lerPreferencia('claro')).toBe('claro')
    expect(lerPreferencia('escuro')).toBe('escuro')
  })

  it('cai no automático quando não há nada guardado ou o valor não vale', () => {
    expect(lerPreferencia(null)).toBe('automatico')
    expect(lerPreferencia('')).toBe('automatico')
    expect(lerPreferencia('sepia')).toBe('automatico')
  })
})

describe('temaEfetivo', () => {
  it('no automático segue o sistema', () => {
    expect(temaEfetivo('automatico', true)).toBe('escuro')
    expect(temaEfetivo('automatico', false)).toBe('claro')
  })

  it('a escolha manual manda no sistema', () => {
    expect(temaEfetivo('claro', true)).toBe('claro')
    expect(temaEfetivo('escuro', false)).toBe('escuro')
  })
})

describe('proximaPreferencia', () => {
  it('gira automático, claro, escuro e volta', () => {
    expect(proximaPreferencia('automatico')).toBe('claro')
    expect(proximaPreferencia('claro')).toBe('escuro')
    expect(proximaPreferencia('escuro')).toBe('automatico')
  })
})

describe('rotuloDaPreferencia', () => {
  it('tem rótulo em PT-BR pras três', () => {
    expect(rotuloDaPreferencia('automatico')).toBe('Do sistema')
    expect(rotuloDaPreferencia('claro')).toBe('Claro')
    expect(rotuloDaPreferencia('escuro')).toBe('Escuro')
  })
})
