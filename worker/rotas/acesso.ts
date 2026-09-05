import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import {
  criarConvite,
  criarSessao,
  encerrarSessao,
  listaEsqueciLigada,
  listarMembros,
  membroPorId,
  usarConvite,
} from '../dados/acesso'
import { NOME_DA_SESSAO, opcoesDoCookie } from '../http/cookies'
import { estaSilenciado } from '../dados/push'
import type { Contexto } from '../tipos'

export const acesso = new Hono<Contexto>()

acesso.post('/api/admin/convites', exigirMinistro, async (c) => {
  const { membroId } = await c.req.json<{ membroId?: string }>()
  const membro = membroId ? await membroPorId(c.env.DB, membroId) : null

  if (!membro) return c.json({ erro: 'Membro não encontrado.' }, 404)

  const token = await criarConvite(c.env.DB, membro.id)

  return c.json({ token, link: `/entrar/${token}`, membro: { id: membro.id, nome: membro.nome } }, 201)
})

acesso.get('/entrar/:token', async (c) => {
  const membroId = await usarConvite(c.env.DB, c.req.param('token'))

  if (!membroId) return c.html(PAGINA_DE_LINK_INVALIDO, 404)

  await abrirSessao(c, membroId)

  return c.redirect('/instalar', 302)
})

acesso.get('/api/eu', exigirMembro, async (c) => {
  const membro = c.get('membro')

  return c.json({ ...membro, silenciado: await estaSilenciado(c.env.DB, membro.id) })
})

acesso.get('/api/esqueci', async (c) => {
  if (!(await listaEsqueciLigada(c.env.DB))) return c.json({ erro: RECUSA_DA_LISTA }, 403)

  return c.json({ membros: await listarMembros(c.env.DB) })
})

acesso.post('/api/esqueci', async (c) => {
  if (!(await listaEsqueciLigada(c.env.DB))) return c.json({ erro: RECUSA_DA_LISTA }, 403)

  const { membroId } = await c.req.json<{ membroId?: string }>()
  const membro = membroId ? await membroPorId(c.env.DB, membroId) : null

  if (!membro) return c.json({ erro: 'Membro não encontrado.' }, 404)

  await abrirSessao(c, membro.id)

  return c.json(membro)
})

acesso.post('/api/sair', exigirMembro, async (c) => {
  await encerrarSessao(c.env.DB, c.get('sessao'))
  deleteCookie(c, NOME_DA_SESSAO, opcoesDoCookie(c.req.url))

  return c.json({ ok: true })
})

async function abrirSessao(c: Context<Contexto>, membroId: string): Promise<void> {
  const token = await criarSessao(c.env.DB, membroId, c.req.header('user-agent') ?? null)
  setCookie(c, NOME_DA_SESSAO, token, opcoesDoCookie(c.req.url))
}

const RECUSA_DA_LISTA = 'A lista de Membros está desligada. Peça um link de convite a um Ministro.'

const PAGINA_DE_LINK_INVALIDO = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link inválido — Renovo Hub</title>
  </head>
  <body>
    <h1>Link inválido</h1>
    <p>Este convite não existe. Peça outro a um Ministro ou entre por <a href="/esqueci">Esqueci / troquei de celular</a>.</p>
  </body>
</html>
`
