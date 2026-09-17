import { describe, expect, it } from 'vitest'
import type { Pacote } from '../api/tipos'
import { CHAVE_DO_PACOTE, guardarPacote, idadeDoPacote, lerPacote } from './pacote'
import type { Deposito } from './pacote'

function pacoteDe(geradoEm: string): Pacote {
  return { geradoEm, escalas: [], catalogo: [] }
}

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

describe('pacote no aparelho', () => {
  it('guarda e lê o pacote', () => {
    const deposito = depositoFalso()
    const pacote = pacoteDe('2026-09-16T12:00:00.000Z')

    guardarPacote(pacote, deposito)

    expect(deposito.getItem(CHAVE_DO_PACOTE)).toBe(JSON.stringify(pacote))
    expect(lerPacote(deposito)).toEqual(pacote)
  })

  it('lê nada quando não há pacote guardado', () => {
    expect(lerPacote(depositoFalso())).toBeNull()
  })

  it('lê nada quando o guardado não é um pacote', () => {
    expect(lerPacote(depositoFalso({ [CHAVE_DO_PACOTE]: 'nem json' }))).toBeNull()
  })

  it('falha em silêncio quando o armazenamento não deixa guardar nem ler', () => {
    const deposito = depositoQuebrado()

    expect(() => guardarPacote(pacoteDe('2026-09-16T12:00:00.000Z'), deposito)).not.toThrow()
    expect(lerPacote(deposito)).toBeNull()
  })

  it('sobrevive a não haver armazenamento nenhum', () => {
    expect(() => guardarPacote(pacoteDe('2026-09-16T12:00:00.000Z'), null)).not.toThrow()
    expect(lerPacote(null)).toBeNull()
  })
})

describe('idade do pacote', () => {
  const pacote = pacoteDe('2026-09-10T12:00:00.000Z')

  it('conta os dias inteiros desde que foi gerado', () => {
    expect(idadeDoPacote(pacote, new Date('2026-09-10T18:00:00.000Z'))).toBe(0)
    expect(idadeDoPacote(pacote, new Date('2026-09-17T11:00:00.000Z'))).toBe(6)
    expect(idadeDoPacote(pacote, new Date('2026-09-18T12:00:00.000Z'))).toBe(8)
  })

  it('não fica negativa quando o relógio do aparelho está atrasado', () => {
    expect(idadeDoPacote(pacote, new Date('2026-09-09T12:00:00.000Z'))).toBe(0)
  })
})
