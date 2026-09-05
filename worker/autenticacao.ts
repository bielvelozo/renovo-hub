import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { Membro } from '../src/dominio/tipos'
import { marcarUsoDaSessao, membroPorSessao } from './dados/acesso'
import { NOME_DA_SESSAO } from './http/cookies'
import type { Contexto } from './tipos'

export const exigirMembro = exigir(() => true, '')

export const exigirMinistro = exigir(
  (membro) => membro.ministro || membro.admin,
  'Só um Ministro ou Admin pode fazer isso.',
)

export const exigirAdmin = exigir((membro) => membro.admin, 'Só um Admin pode fazer isso.')

function exigir(permite: (membro: Membro) => boolean, recusa: string) {
  return createMiddleware<Contexto>(async (c, next) => {
    const token = getCookie(c, NOME_DA_SESSAO)
    const membro = token ? await membroPorSessao(c.env.DB, token) : null

    if (!token || !membro) return c.json({ erro: 'Entre pelo seu link de convite.' }, 401)
    if (!permite(membro)) return c.json({ erro: recusa }, 403)

    c.set('membro', membro)
    c.set('sessao', token)
    await marcarUsoDaSessao(c.env.DB, token)

    await next()
  })
}
