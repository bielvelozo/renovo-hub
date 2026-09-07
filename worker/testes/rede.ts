import { vi } from 'vitest'

export type RespostaFalsa = { status: number; corpo?: unknown; texto?: string; falha?: boolean }

export type RedeFalsa = { chamadas: string[] }

// A versão 0.22 do pool não exporta mais `fetchMock` de `cloudflare:test`. Como o
// Worker roda no mesmo isolate do teste, trocar o `fetch` global alcança as duas
// pontas e ainda deixa contar chamadas, que é como se prova o cache do oEmbed.
export function fingirRede(rotas: Record<string, RespostaFalsa>): RedeFalsa {
  const chamadas: string[] = []

  vi.stubGlobal('fetch', async (entrada: RequestInfo | URL): Promise<Response> => {
    const url = entrada instanceof Request ? entrada.url : String(entrada)
    chamadas.push(url)

    const chave = Object.keys(rotas).find((parte) => url.includes(parte))
    if (!chave) throw new Error('Chamada de rede não prevista no teste: ' + url)

    const resposta = rotas[chave]
    if (resposta.falha) throw new Error('rede fora do ar')

    if (resposta.texto !== undefined) {
      return new Response(resposta.texto, { status: resposta.status, headers: { 'content-type': 'text/html' } })
    }

    return new Response(resposta.corpo === undefined ? null : JSON.stringify(resposta.corpo), {
      status: resposta.status,
      headers: { 'content-type': 'application/json' },
    })
  })

  return { chamadas }
}

export type PushFalso = { pedidos: Request[] }

// O despacho precisa do pedido inteiro (cabeçalhos e corpo cifrado), não só da URL.
export function fingirPush(status: (endpoint: string) => number): PushFalso {
  const pedidos: Request[] = []

  vi.stubGlobal('fetch', async (entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pedido = entrada instanceof Request ? entrada : new Request(String(entrada), init)
    pedidos.push(pedido.clone())

    return new Response(null, { status: status(pedido.url) })
  })

  return { pedidos }
}
