import { SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
} from '../testes/apoio'

const RAIZ = 'http://local.test'
const WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

type Anexo = {
  id: string
  musicaId: string
  nome: string
  mime: string
  tamanho: number
  versao: number
  url: string
}

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
})

function conteudo(tamanho: number): Uint8Array {
  return Uint8Array.from({ length: tamanho }, (_, i) => (i * 7) % 251)
}

async function enviar(
  bytes: Uint8Array,
  quem = 'marcos',
  nome = 'Sequência Rio.docx',
  musicaId = 'rio',
): Promise<Response> {
  const formulario = new FormData()
  formulario.append('arquivo', new File([bytes as BufferSource], nome, { type: WORD }))

  return SELF.fetch(`${RAIZ}/api/musicas/${musicaId}/anexos`, {
    method: 'POST',
    body: formulario,
    headers: { cookie: await cookieDe(quem) },
  })
}

async function pedir(caminho: string, quem: string): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, { headers: { cookie: await cookieDe(quem) } })
}

describe('anexos da Sequência', () => {
  it('sobe um arquivo e baixa igual', async () => {
    const bytes = conteudo(2048)

    const resposta = await enviar(bytes)

    expect(resposta.status).toBe(201)
    const anexo = await resposta.json<Anexo>()
    expect(anexo).toMatchObject({ musicaId: 'rio', nome: 'Sequência Rio.docx', mime: WORD, tamanho: 2048, versao: 1 })

    const baixado = await pedir(anexo.url, 'julia')

    expect(baixado.status).toBe(200)
    expect(baixado.headers.get('content-type')).toBe(WORD)
    expect(new Uint8Array(await baixado.arrayBuffer())).toEqual(bytes)
  })

  it('cada envio vira uma versão nova, da mais nova pra mais velha', async () => {
    await enviar(conteudo(10))
    await enviar(conteudo(20))

    const resposta = await pedir('/api/musicas/rio/anexos', 'julia')
    const { anexos } = await resposta.json<{ anexos: Anexo[] }>()

    expect(anexos.map((a) => a.versao)).toEqual([2, 1])
    expect(anexos[0].tamanho).toBe(20)
  })

  it('o detalhe da Música traz os anexos', async () => {
    await enviar(conteudo(10))

    const resposta = await pedir('/api/musicas/rio', 'julia')
    const { anexos } = await resposta.json<{ anexos: Anexo[] }>()

    expect(anexos).toHaveLength(1)
  })

  it('recusa arquivo acima de 1 MB', async () => {
    const resposta = await enviar(conteudo(1024 * 1024 + 1))

    expect(resposta.status).toBe(413)
    expect((await resposta.json<{ erro: string }>()).erro).toBe('O arquivo passa de 1 MB.')
  })

  it('recusa envio sem arquivo', async () => {
    const formulario = new FormData()
    formulario.append('arquivo', 'não sou arquivo')

    const resposta = await SELF.fetch(`${RAIZ}/api/musicas/rio/anexos`, {
      method: 'POST',
      body: formulario,
      headers: { cookie: await cookieDe('marcos') },
    })

    expect(resposta.status).toBe(422)
  })

  it('recusa Membro comum no envio', async () => {
    expect((await enviar(conteudo(10), 'julia')).status).toBe(403)
  })

  it('devolve 404 em Música e anexo que não existem', async () => {
    expect((await pedir('/api/musicas/nao-existe/anexos', 'marcos')).status).toBe(404)
    expect((await pedir('/api/anexos/nao-existe', 'marcos')).status).toBe(404)
  })

  it('a Escala traz os anexos de todas as Músicas do Repertório', async () => {
    await criarMusica('dono', 'Dono da Minha Afeição', 'IxpWNuxGmzc')
    await criarMusica('fora', 'Fora do Repertório', 'pXQRyiSZ8mQ')
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarItemInteira('i1', 'e1', 'rio', 'D', 1)
    await criarItemInteira('i2', 'e1', 'dono', 'F', 2)
    await enviar(conteudo(10))
    await enviar(conteudo(20), 'marcos', 'Sequência Dono.docx', 'dono')
    await enviar(conteudo(30), 'marcos', 'Sequência de fora.docx', 'fora')

    const resposta = await pedir('/api/escalas/e1/anexos', 'julia')

    expect(resposta.status).toBe(200)
    const { anexos } = await resposta.json<{ anexos: Anexo[] }>()
    expect(anexos.map((a) => a.musicaId).sort()).toEqual(['dono', 'rio'])
  })

  it('a Escala sem anexo nenhum devolve lista vazia, e a que não existe devolve 404', async () => {
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarItemInteira('i1', 'e1', 'rio', 'D', 1)

    const { anexos } = await (await pedir('/api/escalas/e1/anexos', 'julia')).json<{ anexos: Anexo[] }>()

    expect(anexos).toEqual([])
    expect((await pedir('/api/escalas/nao-existe/anexos', 'julia')).status).toBe(404)
  })

  it('recusa quem não entrou', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/musicas/rio/anexos`)

    expect(resposta.status).toBe(401)
  })
})
