import { Hono } from 'hono'
import type { Context } from 'hono'
import { musicasDoItem } from '../../src/dominio'
import type { Letra } from '../../src/dominio'
import { WordIlegivel, extrairLetra } from '../../src/letra/docx'
import { exigirMembro, exigirMinistro } from '../autenticacao'
import { criarAnexo, lerAnexo, lerAnexosDoDono, lerAnexosDeMusicas, lerConteudo } from '../dados/anexos'
import type { DonoDoAnexo } from '../dados/anexos'
import { carregarMinisterio } from '../dados/ministerio'
import type { Contexto } from '../tipos'

const MAXIMO = 1024 * 1024

export const anexos = new Hono<Contexto>()

anexos.get('/api/musicas/:id/anexos', exigirMembro, async (c) => {
  const musicaId = c.req.param('id')
  if (!(await existeMusica(c.env.DB, musicaId))) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  return c.json({ anexos: await lerAnexosDoDono(c.env.DB, { musicaId }) })
})

anexos.post('/api/musicas/:id/anexos', exigirMinistro, async (c) => {
  const musicaId = c.req.param('id')
  if (!(await existeMusica(c.env.DB, musicaId))) return c.json({ erro: MUSICA_NAO_ENCONTRADA }, 404)

  return receberAnexo(c, { musicaId })
})

anexos.get('/api/escalas/:id/anexos', exigirMembro, async (c) => {
  const m = await carregarMinisterio(c.env.DB, { ids: [c.req.param('id')] })
  const escala = m.escalas[0]
  if (!escala) return c.json({ erro: 'Escala não encontrada.' }, 404)

  const musicaIds = [...new Set(escala.itens.flatMap(musicasDoItem))]

  return c.json({ anexos: await lerAnexosDeMusicas(c.env.DB, musicaIds) })
})

anexos.get('/api/anexos/:id', exigirMembro, async (c) => {
  const anexo = await lerAnexo(c.env.DB, c.req.param('id'))
  if (!anexo) return c.json({ erro: 'Anexo não encontrado.' }, 404)

  const conteudo = await lerConteudo(c.env.DB, anexo.id)
  if (!conteudo) return c.json({ erro: 'Anexo não encontrado.' }, 404)

  return new Response(conteudo, {
    headers: {
      'content-type': anexo.mime,
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(anexo.nome)}`,
    },
  })
})

async function receberAnexo(c: Context<Contexto>, dono: DonoDoAnexo) {
  const formulario = await c.req.formData().catch(() => null)
  const arquivo = formulario?.get('arquivo')
  if (!(arquivo instanceof File)) return c.json({ erro: 'Escolha o arquivo da Sequência.' }, 422)
  if (arquivo.size > MAXIMO) return c.json({ erro: 'O arquivo passa de 1 MB.' }, 413)

  const conteudo = await arquivo.arrayBuffer()
  let letra: Letra

  try {
    letra = extrairLetra(new Uint8Array(conteudo))
  } catch (erro) {
    if (!(erro instanceof WordIlegivel)) throw erro

    return c.json({ erro: WORD_ILEGIVEL }, 422)
  }

  const id = await criarAnexo(c.env.DB, dono, {
    nome: arquivo.name,
    mime: arquivo.type || 'application/octet-stream',
    conteudo,
    letra,
  })

  return c.json({ ...(await lerAnexo(c.env.DB, id)), letra }, 201)
}

async function existeMusica(db: D1Database, id: string): Promise<boolean> {
  const linha = await db.prepare('select id from musicas where id = ?').bind(id).first<{ id: string }>()
  return !!linha
}

const MUSICA_NAO_ENCONTRADA = 'Música não encontrada.'
const WORD_ILEGIVEL = 'Não consegui ler a letra desse Word. Salve como .docx e tente de novo.'
