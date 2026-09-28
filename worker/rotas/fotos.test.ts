import { SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { cookieDe, criarMembro, limparBanco } from '../testes/apoio'
import { MAXIMO_DA_FOTO, tipoDaImagem } from './fotos'

const RAIZ = 'http://local.test'
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))))
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

beforeEach(async () => {
  await limparBanco()
  await criarMembro({ id: 'ana', nome: 'Ana' })
  await criarMembro({ id: 'davi', nome: 'Davi' })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true })
})

async function enviar(membroId: string, bytes: Uint8Array, quem = membroId): Promise<Response> {
  const formulario = new FormData()
  formulario.append('arquivo', new File([bytes as BufferSource], 'foto.jpg', { type: 'image/jpeg' }))

  return SELF.fetch(`${RAIZ}/api/membros/${membroId}/foto`, {
    method: 'POST',
    body: formulario,
    headers: { cookie: await cookieDe(quem) },
  })
}

async function ler(membroId: string, quem = 'davi'): Promise<Response> {
  return SELF.fetch(`${RAIZ}/api/membros/${membroId}/foto`, { headers: { cookie: await cookieDe(quem) } })
}

async function eu(quem: string): Promise<{ foto: string | null }> {
  const resposta = await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie: await cookieDe(quem) } })
  return resposta.json()
}

describe('foto do Membro', () => {
  it('guarda a foto e devolve a versão que vai na URL', async () => {
    const resposta = await enviar('ana', JPEG)
    const { foto } = await resposta.json<{ foto: string }>()

    expect(resposta.status).toBe(200)
    expect(foto).toEqual(expect.any(String))
    expect((await eu('ana')).foto).toBe(foto)
  })

  it('serve a foto a qualquer Membro, com cache longo', async () => {
    await enviar('ana', WEBP)
    const resposta = await ler('ana')

    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('content-type')).toBe('image/webp')
    expect(resposta.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await resposta.arrayBuffer())).toEqual(WEBP)
  })

  it('troca a foto e muda a versão', async () => {
    const primeira = await (await enviar('ana', JPEG)).json<{ foto: string }>()
    await new Promise((pronto) => setTimeout(pronto, 5))
    const segunda = await (await enviar('ana', WEBP)).json<{ foto: string }>()

    expect(segunda.foto).not.toBe(primeira.foto)
    expect((await ler('ana')).headers.get('content-type')).toBe('image/webp')
  })

  it('remove a foto', async () => {
    await enviar('ana', JPEG)
    const resposta = await SELF.fetch(`${RAIZ}/api/membros/ana/foto`, {
      method: 'DELETE',
      headers: { cookie: await cookieDe('ana') },
    })

    expect(resposta.status).toBe(200)
    expect((await eu('ana')).foto).toBeNull()
    expect((await ler('ana')).status).toBe(404)
  })

  it('não deixa trocar a foto de outro Membro', async () => {
    expect((await enviar('ana', JPEG, 'davi')).status).toBe(403)
  })

  it('deixa o Admin trocar a foto de outro Membro', async () => {
    expect((await enviar('ana', JPEG, 'gabriel')).status).toBe(200)
  })

  it('recusa o que não é JPEG nem WebP', async () => {
    expect((await enviar('ana', PNG)).status).toBe(415)
  })

  it('recusa foto acima do limite', async () => {
    const grande = new Uint8Array(MAXIMO_DA_FOTO + 1)
    grande.set(JPEG)

    expect((await enviar('ana', grande)).status).toBe(413)
  })

  it('recusa envio sem arquivo', async () => {
    const formulario = new FormData()
    formulario.append('arquivo', 'não sou arquivo')
    const resposta = await SELF.fetch(`${RAIZ}/api/membros/ana/foto`, {
      method: 'POST',
      body: formulario,
      headers: { cookie: await cookieDe('ana') },
    })

    expect(resposta.status).toBe(422)
  })

  it('pede sessão para ver a foto', async () => {
    await enviar('ana', JPEG)

    expect((await SELF.fetch(`${RAIZ}/api/membros/ana/foto`)).status).toBe(401)
  })
})

describe('tipoDaImagem', () => {
  it('reconhece JPEG e WebP pelos primeiros bytes', () => {
    expect(tipoDaImagem(JPEG)).toBe('image/jpeg')
    expect(tipoDaImagem(WEBP)).toBe('image/webp')
    expect(tipoDaImagem(PNG)).toBeNull()
  })
})
