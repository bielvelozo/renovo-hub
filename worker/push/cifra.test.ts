import { describe, expect, it } from 'vitest'
import { base64urlParaBytes, bytesParaBase64url } from '../../src/push/base64'
import {
  TAMANHO_DO_REGISTRO,
  cifrarParaAparelho,
  gerarEfemera,
  parDeChaves,
  segredosDoRegistro,
} from './cifra'

const RFC = {
  carga: 'When I grow up, I want to be a watermelon',
  uaPublica: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  uaPrivada: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPublica: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  asPrivada: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  cek: 'oIhVW04MRdy2XN9CiKLxTg',
  nonce: '4h_95klXJ5E_qnoN',
}

const aparelho = { p256dh: RFC.uaPublica, auth: RFC.auth }

describe('segredosDoRegistro', () => {
  it('deriva a CEK e o nonce do exemplo do RFC 8291', async () => {
    const efemera = await parDeChaves(RFC.asPrivada, RFC.asPublica)

    const segredos = await segredosDoRegistro({
      privada: efemera.privada,
      publicaDoOutro: base64urlParaBytes(RFC.uaPublica),
      uaPublica: base64urlParaBytes(RFC.uaPublica),
      asPublica: efemera.publica,
      auth: base64urlParaBytes(RFC.auth),
      salt: base64urlParaBytes(RFC.salt),
    })

    expect(bytesParaBase64url(segredos.cek)).toBe(RFC.cek)
    expect(bytesParaBase64url(segredos.nonce)).toBe(RFC.nonce)
  })

  it('chega no mesmo segredo pelo lado do aparelho', async () => {
    const efemera = await parDeChaves(RFC.asPrivada, RFC.asPublica)
    const doAparelho = await parDeChaves(RFC.uaPrivada, RFC.uaPublica)

    const segredos = await segredosDoRegistro({
      privada: doAparelho.privada,
      publicaDoOutro: efemera.publica,
      uaPublica: doAparelho.publica,
      asPublica: efemera.publica,
      auth: base64urlParaBytes(RFC.auth),
      salt: base64urlParaBytes(RFC.salt),
    })

    expect(bytesParaBase64url(segredos.cek)).toBe(RFC.cek)
  })
})

describe('cifrarParaAparelho', () => {
  it('monta o cabeçalho aes128gcm com salt, tamanho do registro e a chave efêmera', async () => {
    const corpo = await cifrarParaAparelho(aparelho, RFC.carga)
    const visao = new DataView(corpo.buffer, corpo.byteOffset, corpo.byteLength)

    expect(visao.getUint32(16)).toBe(TAMANHO_DO_REGISTRO)
    expect(corpo[20]).toBe(65)
    expect(corpo[21]).toBe(4)
    expect(corpo.length).toBe(16 + 4 + 1 + 65 + RFC.carga.length + 1 + 16)
  })

  it('entrega um corpo que o aparelho do RFC consegue abrir', async () => {
    const corpo = await cifrarParaAparelho(aparelho, RFC.carga)

    expect(await abrirComoAparelho(corpo)).toBe(RFC.carga)
  })

  it('troca de salt e de chave efêmera a cada envio', async () => {
    const um = await cifrarParaAparelho(aparelho, RFC.carga)
    const outro = await cifrarParaAparelho(aparelho, RFC.carga)

    expect(bytesParaBase64url(um)).not.toBe(bytesParaBase64url(outro))
    expect(await abrirComoAparelho(outro)).toBe(RFC.carga)
  })

  it('gera par efêmero P-256 novo em cada chamada', async () => {
    const um = await gerarEfemera()
    const outro = await gerarEfemera()

    expect(um.publica.length).toBe(65)
    expect(um.publica[0]).toBe(4)
    expect(bytesParaBase64url(um.publica)).not.toBe(bytesParaBase64url(outro.publica))
  })
})

async function abrirComoAparelho(corpo: Uint8Array): Promise<string> {
  const doAparelho = await parDeChaves(RFC.uaPrivada, RFC.uaPublica)
  const salt = corpo.slice(0, 16)
  const asPublica = corpo.slice(21, 21 + corpo[20])
  const cifra = corpo.slice(21 + corpo[20])

  const { cek, nonce } = await segredosDoRegistro({
    privada: doAparelho.privada,
    publicaDoOutro: asPublica,
    uaPublica: doAparelho.publica,
    asPublica,
    auth: base64urlParaBytes(RFC.auth),
    salt,
  })

  const chave = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt'])
  const aberto = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, chave, cifra),
  )

  expect(aberto[aberto.length - 1]).toBe(2)

  return new TextDecoder().decode(aberto.slice(0, -1))
}
