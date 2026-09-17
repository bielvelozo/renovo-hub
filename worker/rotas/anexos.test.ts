import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Letra } from '../../src/dominio'
import { docxDe } from '../../src/letra/docxSintetico'
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
  musicaId: string | null
  itemId: string | null
  nome: string
  mime: string
  tamanho: number
  temLetra: boolean
  versao: number
  url: string
  letra?: Letra
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

function word(linha: string): Uint8Array {
  return docxDe([{ runs: [{ texto: 'Rio – Canal', negrito: true }] }, '', '//VERSO', linha])
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

async function enviarNoItem(bytes: Uint8Array, itemId: string, quem = 'marcos'): Promise<Response> {
  const formulario = new FormData()
  formulario.append('arquivo', new File([bytes as BufferSource], 'Medley.docx', { type: WORD }))

  return SELF.fetch(`${RAIZ}/api/itens/${itemId}/anexos`, {
    method: 'POST',
    body: formulario,
    headers: { cookie: await cookieDe(quem) },
  })
}

async function criarMedley(id: string, escalaId: string, musicaIds: string[]): Promise<void> {
  await env.DB.prepare('insert into itens (id, escala_id, ordem, tipo, observacao) values (?, ?, ?, ?, ?)')
    .bind(id, escalaId, 0, 'medley', '')
    .run()

  for (const [ordem, musicaId] of musicaIds.entries()) {
    await env.DB.prepare(
      'insert into trechos (id, item_id, ordem, musica_id, tom, inicio, fim) values (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(`${id}-t${ordem}`, id, ordem, musicaId, 'D', '0:00', '1:20')
      .run()
  }
}

async function pedir(caminho: string, quem: string): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, { headers: { cookie: await cookieDe(quem) } })
}

describe('anexos da Sequência', () => {
  it('sobe um Word, lê a letra e baixa o arquivo igual', async () => {
    const bytes = word('E me mostrou um rio')

    const resposta = await enviar(bytes)

    expect(resposta.status).toBe(201)
    const anexo = await resposta.json<Anexo>()
    expect(anexo).toMatchObject({
      musicaId: 'rio',
      itemId: null,
      nome: 'Sequência Rio.docx',
      mime: WORD,
      tamanho: bytes.length,
      temLetra: true,
      versao: 1,
    })
    expect(anexo.letra).toEqual({
      cabecalho: ['Rio – Canal'],
      blocos: [
        { tipo: 'marcador', texto: '//VERSO' },
        { tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] },
      ],
    })

    const baixado = await pedir(anexo.url, 'julia')

    expect(baixado.status).toBe(200)
    expect(baixado.headers.get('content-type')).toBe(WORD)
    expect(new Uint8Array(await baixado.arrayBuffer())).toEqual(bytes)
  })

  it('cada envio vira uma versão nova, da mais nova pra mais velha', async () => {
    await enviar(word('Primeira letra'))
    const segundo = word('Segunda letra, mais comprida que a primeira')
    await enviar(segundo)

    const resposta = await pedir('/api/musicas/rio/anexos', 'julia')
    const { anexos } = await resposta.json<{ anexos: Anexo[] }>()

    expect(anexos.map((a) => a.versao)).toEqual([2, 1])
    expect(anexos[0].tamanho).toBe(segundo.length)
    expect(anexos.every((a) => a.temLetra)).toBe(true)
  })

  it('recusa Word ilegível e não grava nada', async () => {
    const resposta = await enviar(conteudo(2048))

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe(
      'Não consegui ler a letra desse Word. Salve como .docx e tente de novo.',
    )

    const { anexos } = await (await pedir('/api/musicas/rio/anexos', 'julia')).json<{ anexos: Anexo[] }>()
    expect(anexos).toEqual([])
  })

  it('o detalhe da Música traz os anexos', async () => {
    await enviar(word('Uma linha'))

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
    expect((await enviar(word('Uma linha'), 'julia')).status).toBe(403)
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
    await enviar(word('Do Rio'))
    await enviar(word('Do Dono'), 'marcos', 'Sequência Dono.docx', 'dono')
    await enviar(word('De fora'), 'marcos', 'Sequência de fora.docx', 'fora')

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

  it('a Escala traz junto os anexos dos Itens Medley, com a chave do Item', async () => {
    await criarMusica('dono', 'Dono da Minha Afeição', 'IxpWNuxGmzc')
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarItemInteira('i1', 'e1', 'rio', 'D', 1)
    await criarMedley('i2', 'e1', ['rio', 'dono'])
    await enviar(word('Do Rio'))
    const doMedley = await enviarNoItem(word('Do medley'), 'i2')

    expect(doMedley.status).toBe(201)
    expect(await doMedley.json<Anexo>()).toMatchObject({ musicaId: null, itemId: 'i2', temLetra: true, versao: 1 })

    const { anexos } = await (await pedir('/api/escalas/e1/anexos', 'julia')).json<{ anexos: Anexo[] }>()
    expect(anexos.map((a) => a.itemId ?? a.musicaId).sort()).toEqual(['i2', 'rio'])

    const escala = await (await pedir('/api/escalas/e1', 'julia')).json<{
      anexosPorDono: Record<string, Anexo[]>
    }>()
    expect(Object.keys(escala.anexosPorDono).sort()).toEqual(['item:i2', 'rio'])
  })

  it('o Membro lê a letra do Medley pelo Item', async () => {
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarMedley('i2', 'e1', ['rio'])
    await enviarNoItem(word('Do medley'), 'i2')
    await enviarNoItem(word('Do medley de novo'), 'i2')

    const resposta = await pedir('/api/itens/i2/letra', 'julia')

    expect(resposta.status).toBe(200)
    const { letra } = await resposta.json<{ letra: Letra | null }>()
    expect(letra?.blocos).toEqual([
      { tipo: 'marcador', texto: '//VERSO' },
      { tipo: 'estrofe', linhas: [{ texto: 'Do medley de novo', forte: false }] },
    ])
  })

  it('Item sem anexo devolve letra nula e Item que não existe devolve 404', async () => {
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarMedley('i2', 'e1', ['rio'])

    expect(await (await pedir('/api/itens/i2/letra', 'julia')).json<{ letra: Letra | null }>()).toEqual({ letra: null })
    expect((await pedir('/api/itens/nao-existe/letra', 'julia')).status).toBe(404)
  })

  it('recusa letra em Item que não é Medley e em Item que não existe', async () => {
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarItemInteira('i1', 'e1', 'rio', 'D', 1)

    const naoEhMedley = await enviarNoItem(word('Do item'), 'i1')

    expect(naoEhMedley.status).toBe(422)
    expect((await naoEhMedley.json<{ erro: string }>()).erro).toBe(
      'Só um Medley recebe letra pela Escala. Para uma música, envie na tela dela.',
    )
    expect((await enviarNoItem(word('Do item'), 'nao-existe')).status).toBe(404)
  })

  it('recusa Word ilegível no Medley e Membro comum no envio', async () => {
    await criarEscala({ id: 'e1', data: '2099-08-16' })
    await criarMedley('i2', 'e1', ['rio'])

    expect((await enviarNoItem(conteudo(2048), 'i2')).status).toBe(422)
    expect((await enviarNoItem(word('Do medley'), 'i2', 'julia')).status).toBe(403)
    expect(await (await pedir('/api/itens/i2/letra', 'julia')).json<{ letra: Letra | null }>()).toEqual({ letra: null })
  })

  it('recusa quem não entrou', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/musicas/rio/anexos`)

    expect(resposta.status).toBe(401)
  })
})
