import type { CookieOptions } from 'hono/utils/cookie'

export const NOME_DA_SESSAO = 'sessao'

export const DURACAO_DA_SESSAO = 60 * 60 * 24 * 365

export function opcoesDoCookie(url: string): CookieOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: DURACAO_DA_SESSAO,
    secure: new URL(url).protocol === 'https:',
  }
}
