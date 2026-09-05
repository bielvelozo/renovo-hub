import { describe, expect, it } from 'vitest'
import { DURACAO_DA_SESSAO, NOME_DA_SESSAO, opcoesDoCookie } from './cookies'

describe('opcoesDoCookie', () => {
  it('vale um ano, é HttpOnly, SameSite=Lax e vale em todo o site', () => {
    expect(opcoesDoCookie('http://localhost:8787/entrar/abc')).toMatchObject({
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: DURACAO_DA_SESSAO,
    })
    expect(DURACAO_DA_SESSAO).toBe(60 * 60 * 24 * 365)
  })

  it('não marca Secure em http, para o cookie valer no localhost', () => {
    expect(opcoesDoCookie('http://localhost:8787/entrar/abc').secure).toBe(false)
  })

  it('marca Secure em https', () => {
    expect(opcoesDoCookie('https://renovo-hub.workers.dev/entrar/abc').secure).toBe(true)
  })

  it('guarda a sessão no cookie chamado sessao', () => {
    expect(NOME_DA_SESSAO).toBe('sessao')
  })
})
