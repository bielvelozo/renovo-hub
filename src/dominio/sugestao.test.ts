import { describe, expect, it } from 'vitest'
import { ehEstadoDaSugestao, transicao } from './sugestao'

describe('transicao da Sugestão', () => {
  it('guardar leva de aberta pra guardada, e reabrir volta', () => {
    expect(transicao('aberta', 'guardar')).toBe('guardada')
    expect(transicao('guardada', 'reabrir')).toBe('aberta')
  })

  it('promover e recusar valem de aberta e de guardada', () => {
    expect(transicao('aberta', 'promover')).toBe('aceita')
    expect(transicao('guardada', 'promover')).toBe('aceita')
    expect(transicao('aberta', 'recusar')).toBe('recusada')
    expect(transicao('guardada', 'recusar')).toBe('recusada')
  })

  it('nada sai de aceita nem de recusada', () => {
    expect(transicao('aceita', 'promover')).toBeNull()
    expect(transicao('aceita', 'guardar')).toBeNull()
    expect(transicao('recusada', 'reabrir')).toBeNull()
    expect(transicao('recusada', 'promover')).toBeNull()
  })

  it('guardar o que já está guardado e reabrir o que está aberto são proibidos', () => {
    expect(transicao('guardada', 'guardar')).toBeNull()
    expect(transicao('aberta', 'reabrir')).toBeNull()
  })

  it('reconhece só os quatro estados', () => {
    expect(ehEstadoDaSugestao('aberta')).toBe(true)
    expect(ehEstadoDaSugestao('recusada')).toBe(true)
    expect(ehEstadoDaSugestao('promovida')).toBe(false)
    expect(ehEstadoDaSugestao(null)).toBe(false)
  })
})
