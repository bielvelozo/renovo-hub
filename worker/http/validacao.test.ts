import { describe, expect, it } from 'vitest'
import { ehMinutagem } from './validacao'

describe('ehMinutagem', () => {
  it('aceita minuto e segundo', () => {
    expect(ehMinutagem('0:00')).toBe(true)
    expect(ehMinutagem('1:05')).toBe(true)
    expect(ehMinutagem('12:59')).toBe(true)
  })

  it('recusa o que não é minutagem', () => {
    expect(ehMinutagem('1:5x')).toBe(false)
    expect(ehMinutagem('1:5')).toBe(false)
    expect(ehMinutagem('105')).toBe(false)
    expect(ehMinutagem('')).toBe(false)
    expect(ehMinutagem(65)).toBe(false)
  })

  it('recusa segundo acima de 59', () => {
    expect(ehMinutagem('1:60')).toBe(false)
  })
})
