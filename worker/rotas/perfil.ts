import { Hono } from 'hono'
import { escalasNoAno, finsDeSemanaSeguidos, funcaoPorId, textoDeFinsDeSemana, ultimaEscala } from '../../src/dominio'
import { exigirMembro } from '../autenticacao'
import { carregarMinisterio } from '../dados/ministerio'
import { resumirEscala } from '../http/escala'
import type { Contexto } from '../tipos'

export const perfil = new Hono<Contexto>()

perfil.get('/api/perfil/:id', exigirMembro, async (c) => {
  const m = await carregarMinisterio(c.env.DB)
  const membro = m.membros.find((x) => x.id === c.req.param('id'))
  if (!membro) return c.json({ erro: 'Membro não encontrado.' }, 404)

  const ultima = ultimaEscala(m, membro.id)
  const seguidos = finsDeSemanaSeguidos(m, membro.id)

  return c.json({
    membro: { ...membro, funcoes: membro.funcoes.map((id) => funcaoPorId(m, id)) },
    escalasNoAno: escalasNoAno(m, membro.id),
    ultimaEscala: ultima ? resumirEscala(m, ultima) : null,
    finsDeSemanaSeguidos: seguidos,
    textoDeFinsDeSemana: textoDeFinsDeSemana(seguidos),
  })
})
