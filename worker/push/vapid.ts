import { base64urlParaBytes, bytesParaBase64url } from '../../src/push/base64'

export type ChavesVapid = {
  publica: string
  privada: string
  assunto: string
}

export const VALIDADE_DO_JWT = 12 * 60 * 60 * 1000

const texto = new TextEncoder()

export function chavesDeVapid(env: {
  VAPID_PUBLIC?: string
  VAPID_PRIVATE?: string
  VAPID_SUBJECT?: string
}): ChavesVapid | null {
  if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return null

  return {
    publica: env.VAPID_PUBLIC,
    privada: env.VAPID_PRIVATE,
    assunto: env.VAPID_SUBJECT || 'mailto:renovo@example.com',
  }
}

export function audienciaDe(endpoint: string): string {
  return new URL(endpoint).origin
}

export async function autorizacaoVapid(chaves: ChavesVapid, endpoint: string, agora: Date): Promise<string> {
  const jwt = await assinarVapid(chaves, audienciaDe(endpoint), agora)

  return `vapid t=${jwt}, k=${chaves.publica}`
}

export async function assinarVapid(chaves: ChavesVapid, audiencia: string, agora: Date): Promise<string> {
  const cabecalho = codificar({ typ: 'JWT', alg: 'ES256' })
  const corpo = codificar({
    aud: audiencia,
    exp: Math.floor((agora.getTime() + VALIDADE_DO_JWT) / 1000),
    sub: chaves.assunto,
  })

  const assinado = `${cabecalho}.${corpo}`
  const chave = await importarPrivada(chaves)
  const assinatura = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    chave,
    texto.encode(assinado),
  )

  return `${assinado}.${bytesParaBase64url(assinatura)}`
}

export function importarPrivada(chaves: ChavesVapid): Promise<CryptoKey> {
  const publica = base64urlParaBytes(chaves.publica)

  return crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: chaves.privada,
      x: bytesParaBase64url(publica.slice(1, 33)),
      y: bytesParaBase64url(publica.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

export function importarPublica(publica: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    base64urlParaBytes(publica),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )
}

function codificar(valor: unknown): string {
  return bytesParaBase64url(texto.encode(JSON.stringify(valor)))
}
