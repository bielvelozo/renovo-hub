export function bytesParaBase64url(dado: ArrayBuffer | Uint8Array): string {
  const bytes = dado instanceof Uint8Array ? dado : new Uint8Array(dado)
  let bruto = ''
  for (const byte of bytes) bruto += String.fromCharCode(byte)

  return btoa(bruto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64urlParaBytes(texto: string): Uint8Array<ArrayBuffer> {
  const normal = texto.replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(normal.padEnd(Math.ceil(normal.length / 4) * 4, '='))
  const bytes = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)

  return bytes
}
