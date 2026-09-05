import { describe, expect, it } from 'vitest'
import { cookieDaSessao, tokenDoConvite } from './leitura'

describe('tokenDoConvite', () => {
  it('tira o token da saída do npm run convite', () => {
    const saida = 'Convite para Gabriel:\nhttp://localhost:8787/entrar/0465ebb8-1f0e-4c60-9c1e-1a5f2b7c9d31\n'

    expect(tokenDoConvite(saida)).toBe('0465ebb8-1f0e-4c60-9c1e-1a5f2b7c9d31')
  })

  it('ignora o ruído que o npm põe em volta', () => {
    const saida = ['> renovo-hub@1.0.0 convite', '> tsx scripts/convite.ts "Gabriel"', '', 'Convite para Gabriel:', 'http://localhost:8787/entrar/abc-123', ''].join('\n')

    expect(tokenDoConvite(saida)).toBe('abc-123')
  })

  it('devolve nulo quando o script não imprimiu link', () => {
    expect(tokenDoConvite('Não achei o Membro "Ninguem".')).toBeNull()
  })
})

describe('cookieDaSessao', () => {
  it('fica só com o par nome=valor do cabeçalho inteiro', () => {
    const cabecalho = 'sessao=9f3c; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax'

    expect(cookieDaSessao(cabecalho)).toBe('sessao=9f3c')
  })

  it('acha a sessão mesmo quando vem depois de outro cookie', () => {
    expect(cookieDaSessao('tema=claro; Path=/, sessao=9f3c; Path=/; HttpOnly')).toBe('sessao=9f3c')
  })

  it('devolve nulo sem cabeçalho e quando o cookie não é o da sessão', () => {
    expect(cookieDaSessao(null)).toBeNull()
    expect(cookieDaSessao('tema=claro; Path=/')).toBeNull()
  })
})
