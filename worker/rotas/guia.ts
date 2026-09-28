import { Hono } from 'hono'
import { ehTarefa } from '../../src/guia/tarefas'
import { exigirMembro } from '../autenticacao'
import { definirEscondido, lerGuia, marcarFeita } from '../dados/guia'
import { corpoJson } from '../http/validacao'
import type { Contexto } from '../tipos'

export const guia = new Hono<Contexto>()

guia.get('/api/guia', exigirMembro, async (c) => c.json(await lerGuia(c.env.DB, c.get('membro').id)))

guia.post('/api/guia/feitas', exigirMembro, async (c) => {
  const { tarefa } = await corpoJson<{ tarefa?: unknown }>(c.req.raw)
  if (!ehTarefa(tarefa)) return c.json({ erro: 'Essa tarefa não existe no guia.' }, 422)

  const membroId = c.get('membro').id
  await marcarFeita(c.env.DB, membroId, tarefa)

  return c.json(await lerGuia(c.env.DB, membroId))
})

guia.post('/api/guia/escondido', exigirMembro, async (c) => {
  const { escondido } = await corpoJson<{ escondido?: unknown }>(c.req.raw)
  if (typeof escondido !== 'boolean') return c.json({ erro: 'Esconder o guia é sim ou não.' }, 422)

  const membroId = c.get('membro').id
  await definirEscondido(c.env.DB, membroId, escondido)

  return c.json(await lerGuia(c.env.DB, membroId))
})
