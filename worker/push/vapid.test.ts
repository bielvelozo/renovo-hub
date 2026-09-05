import { beforeAll, describe, expect, it } from 'vitest'
import { base64urlParaBytes, bytesParaBase64url } from '../../src/push/base64'
import { VALIDADE_DO_JWT, assinarVapid, audienciaDe, autorizacaoVapid, chavesDeVapid, importarPublica } from './vapid'
import type { ChavesVapid } from './vapid'

const AGORA = new Date('2026-09-05T12:00:00.000Z')
const ENDPOINT = 'https://web.push.apple.com/QRSTU/abc123'

let chaves: ChavesVapid

beforeAll(async () => {
  chaves = await gerarChaves()
})

describe('chavesDeVapid', () => {
  it('não devolve nada sem as duas chaves', () => {
    expect(chavesDeVapid({})).toBeNull()
    expect(chavesDeVapid({ VAPID_PUBLIC: 'a' })).toBeNull()
    expect(chavesDeVapid({ VAPID_PRIVATE: 'b' })).toBeNull()
  })

  it('lê as chaves do ambiente com um assunto padrão', () => {
    expect(chavesDeVapid({ VAPID_PUBLIC: 'a', VAPID_PRIVATE: 'b' })?.assunto).toMatch(/^mailto:/)
    expect(chavesDeVapid({ VAPID_PUBLIC: 'a', VAPID_PRIVATE: 'b', VAPID_SUBJECT: 'mailto:eu@x.com' })).toEqual({
      publica: 'a',
      privada: 'b',
      assunto: 'mailto:eu@x.com',
    })
  })
})

describe('audienciaDe', () => {
  it('é só a origem do endpoint', () => {
    expect(audienciaDe(ENDPOINT)).toBe('https://web.push.apple.com')
    expect(audienciaDe('https://fcm.googleapis.com/fcm/send/xyz')).toBe('https://fcm.googleapis.com')
  })
})

describe('assinarVapid', () => {
  it('monta o JWT ES256 com aud, exp e sub', async () => {
    const jwt = await assinarVapid(chaves, 'https://web.push.apple.com', AGORA)
    const [cabecalho, corpo, assinatura] = jwt.split('.')

    expect(decodificar(cabecalho)).toEqual({ typ: 'JWT', alg: 'ES256' })
    expect(decodificar(corpo)).toEqual({
      aud: 'https://web.push.apple.com',
      exp: Math.floor((AGORA.getTime() + VALIDADE_DO_JWT) / 1000),
      sub: chaves.assunto,
    })
    expect(base64urlParaBytes(assinatura).length).toBe(64)
  })

  it('expira em 12 horas, dentro do teto de 24 do RFC 8292', async () => {
    const jwt = await assinarVapid(chaves, 'https://web.push.apple.com', AGORA)
    const { exp } = decodificar(jwt.split('.')[1]) as { exp: number }
    const horas = (exp * 1000 - AGORA.getTime()) / 3600000

    expect(horas).toBe(12)
    expect(horas).toBeLessThanOrEqual(24)
  })

  it('gera assinatura verificável com a chave pública', async () => {
    const jwt = await assinarVapid(chaves, 'https://web.push.apple.com', AGORA)
    const [cabecalho, corpo, assinatura] = jwt.split('.')

    const valido = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await importarPublica(chaves.publica),
      base64urlParaBytes(assinatura),
      new TextEncoder().encode(`${cabecalho}.${corpo}`),
    )

    expect(valido).toBe(true)
  })

  it('não passa na verificação se o conteúdo for adulterado', async () => {
    const jwt = await assinarVapid(chaves, 'https://web.push.apple.com', AGORA)
    const [cabecalho, , assinatura] = jwt.split('.')
    const outroCorpo = bytesParaBase64url(new TextEncoder().encode(JSON.stringify({ aud: 'https://mal.example' })))

    const valido = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await importarPublica(chaves.publica),
      base64urlParaBytes(assinatura),
      new TextEncoder().encode(`${cabecalho}.${outroCorpo}`),
    )

    expect(valido).toBe(false)
  })

  it('recusa a chave pública de outro par', async () => {
    const outras = await gerarChaves()
    const jwt = await assinarVapid(chaves, 'https://web.push.apple.com', AGORA)
    const [cabecalho, corpo, assinatura] = jwt.split('.')

    const valido = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await importarPublica(outras.publica),
      base64urlParaBytes(assinatura),
      new TextEncoder().encode(`${cabecalho}.${corpo}`),
    )

    expect(valido).toBe(false)
  })
})

describe('autorizacaoVapid', () => {
  it('monta o cabeçalho com o token e a chave pública', async () => {
    const cabecalho = await autorizacaoVapid(chaves, ENDPOINT, AGORA)
    const [, jwt, publica] = cabecalho.match(/^vapid t=([^,]+), k=(.+)$/) ?? []

    expect(publica).toBe(chaves.publica)
    expect(decodificar(jwt.split('.')[1])).toMatchObject({ aud: 'https://web.push.apple.com' })
  })
})

async function gerarChaves(): Promise<ChavesVapid> {
  const par = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const jwk = (await crypto.subtle.exportKey('jwk', par.privateKey)) as JsonWebKey
  const publica = (await crypto.subtle.exportKey('raw', par.publicKey)) as ArrayBuffer

  return {
    publica: bytesParaBase64url(publica),
    privada: jwk.d!,
    assunto: 'mailto:renovo@example.com',
  }
}

function decodificar(parte: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64urlParaBytes(parte)))
}
