import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { definirConfiguracao, limparBanco } from '../testes/apoio'
import {
  CHAVE_SEMANAS_DE_REPETICAO,
  definirSemanasDeRepeticao,
  ehSemanasDeRepeticao,
  lerSemanasDeRepeticao,
} from './configuracoes'

beforeEach(async () => {
  await limparBanco()
})

describe('semanas de repetição', () => {
  it('vale 4 quando ninguém configurou', async () => {
    expect(await lerSemanasDeRepeticao(env.DB)).toBe(4)
  })

  it('guarda e lê o valor escolhido pelo Admin', async () => {
    await definirSemanasDeRepeticao(env.DB, 6)

    expect(await lerSemanasDeRepeticao(env.DB)).toBe(6)
  })

  it('cai no padrão quando o valor guardado não é um dos aceitos', async () => {
    await definirConfiguracao(CHAVE_SEMANAS_DE_REPETICAO, '5')

    expect(await lerSemanasDeRepeticao(env.DB)).toBe(4)
  })

  it('aceita só 2, 4, 6 e 8', () => {
    expect([2, 4, 6, 8].every(ehSemanasDeRepeticao)).toBe(true)
    expect(ehSemanasDeRepeticao(3)).toBe(false)
    expect(ehSemanasDeRepeticao('4')).toBe(false)
  })
})
