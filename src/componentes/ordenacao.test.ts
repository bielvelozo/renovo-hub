import { describe, expect, it } from 'vitest'
import { indiceSobOPonteiro, mover } from './ordenacao'

describe('mover', () => {
  const lista = ['a', 'b', 'c', 'd']

  it('leva o item pra frente', () => {
    expect(mover(lista, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('leva o item pra trás', () => {
    expect(mover(lista, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('devolve a mesma ordem quando não sai do lugar', () => {
    expect(mover(lista, 2, 2)).toEqual(lista)
  })

  it('não deixa passar das pontas', () => {
    expect(mover(lista, 0, -1)).toEqual(lista)
    expect(mover(lista, 3, 9)).toEqual(lista)
  })
})

describe('indiceSobOPonteiro', () => {
  const caixas = [
    { topo: 0, base: 50 },
    { topo: 50, base: 100 },
    { topo: 100, base: 150 },
  ]

  it('acha a linha em que o dedo está', () => {
    expect(indiceSobOPonteiro(caixas, 25)).toBe(0)
    expect(indiceSobOPonteiro(caixas, 75)).toBe(1)
    expect(indiceSobOPonteiro(caixas, 149)).toBe(2)
  })

  it('gruda na primeira acima e na última abaixo', () => {
    expect(indiceSobOPonteiro(caixas, -80)).toBe(0)
    expect(indiceSobOPonteiro(caixas, 900)).toBe(2)
  })

  it('devolve nulo quando não há linha nenhuma', () => {
    expect(indiceSobOPonteiro([], 10)).toBeNull()
  })
})
