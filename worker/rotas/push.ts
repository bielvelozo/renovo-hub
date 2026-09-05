import { Hono } from 'hono'
import { gravarConfiguracao } from '../dados/acesso'
import { enfileirar } from '../dados/notificacoes'
import { apagarInscricaoPorEndpoint, definirSilenciado, estaSilenciado, guardarInscricao, inscricoesDe } from '../dados/push'
import { exigirMembro } from '../autenticacao'
import { CHAVE_DA_ORIGEM, despachar } from '../push/despacho'
import { chavesDeVapid } from '../push/vapid'
import { corpoJson, ehTextoCheio } from '../http/validacao'
import type { Contexto } from '../tipos'

export const push = new Hono<Contexto>()

push.get('/api/push/chave', exigirMembro, (c) => {
  const chaves = chavesDeVapid(c.env)

  return c.json({ chave: chaves?.publica ?? null })
})

push.post('/api/push/inscrever', exigirMembro, async (c) => {
  const corpo = await corpoJson<Record<string, unknown>>(c.req.raw)

  if (!ehTextoCheio(corpo.endpoint) || !ehTextoCheio(corpo.p256dh) || !ehTextoCheio(corpo.auth)) {
    return c.json({ erro: 'Envie o endereço e as chaves da inscrição.' }, 422)
  }

  const membro = c.get('membro')
  const id = await guardarInscricao(c.env.DB, membro.id, {
    endpoint: corpo.endpoint,
    p256dh: corpo.p256dh,
    auth: corpo.auth,
  })

  await gravarConfiguracao(c.env.DB, CHAVE_DA_ORIGEM, new URL(c.req.url).origin)

  return c.json({ id, silenciado: await estaSilenciado(c.env.DB, membro.id) }, 201)
})

push.post('/api/push/desinscrever', exigirMembro, async (c) => {
  const corpo = await corpoJson<{ endpoint?: unknown }>(c.req.raw)
  if (!ehTextoCheio(corpo.endpoint)) return c.json({ erro: 'Envie o endereço da inscrição.' }, 422)

  await apagarInscricaoPorEndpoint(c.env.DB, corpo.endpoint)

  return c.json({ ok: true })
})

push.post('/api/push/silenciar', exigirMembro, async (c) => {
  const corpo = await corpoJson<{ silenciado?: unknown }>(c.req.raw)
  if (typeof corpo.silenciado !== 'boolean') return c.json({ erro: 'Silenciar é sim ou não.' }, 422)

  await definirSilenciado(c.env.DB, c.get('membro').id, corpo.silenciado)

  return c.json({ silenciado: corpo.silenciado })
})

push.post('/api/push/teste', exigirMembro, async (c) => {
  const membro = c.get('membro')

  if (!chavesDeVapid(c.env)) {
    return c.json({ erro: 'As chaves de push não estão configuradas neste servidor.' }, 503)
  }

  const aparelhos = await inscricoesDe(c.env.DB, membro.id)
  if (!aparelhos.length) {
    return c.json({ erro: 'Este aparelho ainda não está inscrito. Ative as notificações primeiro.' }, 409)
  }

  const agora = new Date()
  await gravarConfiguracao(c.env.DB, CHAVE_DA_ORIGEM, new URL(c.req.url).origin)

  await enfileirar(
    c.env.DB,
    {
      membroId: membro.id,
      tipo: 'escalado',
      escalaId: null,
      aviso: {
        titulo: 'Renovo Hub',
        corpo: 'Deu certo: é assim que os avisos da Escala vão chegar.',
        url: '/perfil',
      },
      enviarApos: agora.toISOString(),
    },
    agora,
  )

  const resultado = await despachar(c.env, agora)

  return c.json({ aparelhos: resultado.aparelhos, silenciado: resultado.silenciadas > 0 })
})
