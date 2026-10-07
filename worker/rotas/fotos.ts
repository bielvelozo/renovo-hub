import { Hono } from 'hono'
import type { Context } from 'hono'
import { exigirMembro } from '../autenticacao'
import { apagarFoto, existeMembro, guardarFoto, lerFoto } from '../dados/fotos'
import type { Contexto } from '../tipos'

export const MAXIMO_DA_FOTO = 300 * 1024

export const fotos = new Hono<Contexto>()

fotos.get('/api/membros/:id/foto', exigirMembro, async (c) => {
  const foto = await lerFoto(c.env.DB, c.req.param('id'))
  if (!foto) return c.json({ erro: FOTO_NAO_ENCONTRADA }, 404)

  return new Response(foto.conteudo, {
    headers: {
      'content-type': foto.mime,
      'cache-control': 'private, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  })
})

fotos.post('/api/membros/:id/foto', exigirMembro, async (c) => {
  const membroId = c.req.param('id')
  const recusa = await recusaDaTroca(c, membroId)
  if (recusa) return recusa

  const formulario = await c.req.formData().catch(() => null)
  const arquivo = formulario?.get('arquivo')
  if (!(arquivo instanceof File)) return c.json({ erro: 'Escolha uma foto.' }, 422)
  if (arquivo.size > MAXIMO_DA_FOTO) return c.json({ erro: 'A foto passa de 300 KB.' }, 413)

  const conteudo = await arquivo.arrayBuffer()
  const mime = tipoDaImagem(new Uint8Array(conteudo))
  if (!mime) return c.json({ erro: 'Envie a foto em JPEG ou WebP.' }, 415)

  return c.json({ foto: await guardarFoto(c.env.DB, membroId, { mime, conteudo }) })
})

fotos.delete('/api/membros/:id/foto', exigirMembro, async (c) => {
  const membroId = c.req.param('id')
  const recusa = await recusaDaTroca(c, membroId)
  if (recusa) return recusa

  await apagarFoto(c.env.DB, membroId)

  return c.json({ foto: null })
})

export function tipoDaImagem(bytes: Uint8Array): 'image/jpeg' | 'image/webp' | null {
  const texto = (inicio: number, fim: number) => String.fromCharCode(...bytes.subarray(inicio, fim))

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (texto(0, 4) === 'RIFF' && texto(8, 12) === 'WEBP') return 'image/webp'

  return null
}

async function recusaDaTroca(c: Context<Contexto>, membroId: string) {
  const eu = c.get('membro')
  if (eu.id !== membroId && !eu.admin) return c.json({ erro: 'Só dá pra trocar a sua própria foto.' }, 403)
  if (!(await existeMembro(c.env.DB, membroId))) return c.json({ erro: 'Membro não encontrado.' }, 404)

  return null
}

const FOTO_NAO_ENCONTRADA = 'Foto não encontrada.'
