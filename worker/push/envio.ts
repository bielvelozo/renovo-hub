import type { Aviso } from '../../src/dominio'
import type { Inscricao } from '../dados/push'
import { cifrarParaAparelho } from './cifra'
import { autorizacaoVapid } from './vapid'
import type { ChavesVapid } from './vapid'

export const TTL_DO_PUSH = 24 * 60 * 60

// Declarative Web Push (iOS 18.4+): o sistema mostra sozinho pelo objeto
// `notification`; onde não houver, o service worker lê o mesmo objeto.
export function cargaDoAviso(aviso: Aviso, origem: string): string {
  return JSON.stringify({
    web_push: 8030,
    notification: {
      title: aviso.titulo,
      body: aviso.corpo,
      navigate: new URL(aviso.url, origem).toString(),
      lang: 'pt-BR',
    },
  })
}

export async function enviarPush(
  chaves: ChavesVapid,
  inscricao: Inscricao,
  carga: string,
  agora: Date,
): Promise<number> {
  const corpo = await cifrarParaAparelho(inscricao, carga)

  const resposta = await fetch(inscricao.endpoint, {
    method: 'POST',
    headers: {
      authorization: await autorizacaoVapid(chaves, inscricao.endpoint, agora),
      'content-encoding': 'aes128gcm',
      'content-type': 'application/octet-stream',
      ttl: String(TTL_DO_PUSH),
      urgency: 'normal',
    },
    body: corpo,
  })

  return resposta.status
}

export function inscricaoMorreu(status: number): boolean {
  return status === 404 || status === 410
}
