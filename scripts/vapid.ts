import { webcrypto } from 'node:crypto'

const par = (await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
])) as webcrypto.CryptoKeyPair

const privada = await webcrypto.subtle.exportKey('jwk', par.privateKey)
const publica = await webcrypto.subtle.exportKey('raw', par.publicKey)

console.log('Chaves VAPID novas. Ponha estas três linhas no arquivo .dev.vars da raiz:\n')
console.log(`VAPID_PUBLIC=${base64url(publica)}`)
console.log(`VAPID_PRIVATE=${privada.d}`)
console.log('VAPID_SUBJECT=mailto:seu-email@exemplo.com')
console.log('\nNo Cloudflare, as mesmas três viram secrets:\n')
console.log('  npx wrangler secret put VAPID_PUBLIC')
console.log('  npx wrangler secret put VAPID_PRIVATE')
console.log('  npx wrangler secret put VAPID_SUBJECT')
console.log('\nTrocar as chaves invalida as inscrições já feitas: todo mundo precisa ativar de novo.')

function base64url(dado: ArrayBuffer): string {
  return Buffer.from(dado).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
