import { base64urlParaBytes, bytesParaBase64url } from '../../src/push/base64'

export type ChavesDoAparelho = {
  p256dh: string
  auth: string
}

export type ParDeChaves = {
  privada: CryptoKey
  publica: Uint8Array
}

export type Segredos = {
  cek: Uint8Array
  nonce: Uint8Array
}

export type Registro = {
  privada: CryptoKey
  publicaDoOutro: Uint8Array
  uaPublica: Uint8Array
  asPublica: Uint8Array
  auth: Uint8Array
  salt: Uint8Array
}

export const TAMANHO_DO_REGISTRO = 4096

const texto = new TextEncoder()

export async function gerarEfemera(): Promise<ParDeChaves> {
  const par = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair
  const publica = (await crypto.subtle.exportKey('raw', par.publicKey)) as ArrayBuffer

  return { privada: par.privateKey, publica: new Uint8Array(publica) }
}

export async function parDeChaves(privada: string, publica: string): Promise<ParDeChaves> {
  const bytes = base64urlParaBytes(publica)

  return {
    privada: await crypto.subtle.importKey(
      'jwk',
      {
        kty: 'EC',
        crv: 'P-256',
        d: privada,
        x: bytesParaBase64url(bytes.slice(1, 33)),
        y: bytesParaBase64url(bytes.slice(33, 65)),
      },
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits'],
    ),
    publica: bytes,
  }
}

export async function segredosDoRegistro(registro: Registro): Promise<Segredos> {
  const publicaDoOutro = await crypto.subtle.importKey(
    'raw',
    registro.publicaDoOutro,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )

  const compartilhado = new Uint8Array(
    await crypto.subtle.deriveBits(comChaveDoOutro(publicaDoOutro), registro.privada, 256),
  )

  const infoDaChave = juntar([
    texto.encode('WebPush: info'),
    Uint8Array.of(0),
    registro.uaPublica,
    registro.asPublica,
  ])

  const ikm = await expandir(await extrair(registro.auth, compartilhado), infoDaChave, 32)
  const prk = await extrair(registro.salt, ikm)

  return {
    cek: await expandir(prk, rotulo('aes128gcm'), 16),
    nonce: await expandir(prk, rotulo('nonce'), 12),
  }
}

export async function cifrarParaAparelho(
  aparelho: ChavesDoAparelho,
  carga: string,
  efemera?: ParDeChaves,
  salt?: Uint8Array,
): Promise<Uint8Array> {
  const nossa = efemera ?? (await gerarEfemera())
  const tempero = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const uaPublica = base64urlParaBytes(aparelho.p256dh)

  const { cek, nonce } = await segredosDoRegistro({
    privada: nossa.privada,
    publicaDoOutro: uaPublica,
    uaPublica,
    asPublica: nossa.publica,
    auth: base64urlParaBytes(aparelho.auth),
    salt: tempero,
  })

  const chave = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const conteudo = juntar([texto.encode(carga), Uint8Array.of(2)])
  const cifra = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, chave, conteudo),
  )

  const cabecalho = new Uint8Array(21)
  cabecalho.set(tempero, 0)
  new DataView(cabecalho.buffer).setUint32(16, TAMANHO_DO_REGISTRO)
  cabecalho[20] = nossa.publica.length

  return juntar([cabecalho, nossa.publica, cifra])
}

function comChaveDoOutro(publica: CryptoKey): SubtleCryptoDeriveKeyAlgorithm {
  return { name: 'ECDH', public: publica } as unknown as SubtleCryptoDeriveKeyAlgorithm
}

function rotulo(nome: string): Uint8Array {
  return juntar([texto.encode('Content-Encoding: ' + nome), Uint8Array.of(0)])
}

async function extrair(sal: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey('raw', sal, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])

  return new Uint8Array(await crypto.subtle.sign('HMAC', chave, ikm))
}

async function expandir(prk: Uint8Array, info: Uint8Array, tamanho: number): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bloco = new Uint8Array(await crypto.subtle.sign('HMAC', chave, juntar([info, Uint8Array.of(1)])))

  return bloco.slice(0, tamanho)
}

function juntar(partes: Uint8Array[]): Uint8Array {
  const total = partes.reduce((soma, parte) => soma + parte.length, 0)
  const saida = new Uint8Array(total)
  let posicao = 0

  for (const parte of partes) {
    saida.set(parte, posicao)
    posicao += parte.length
  }

  return saida
}
