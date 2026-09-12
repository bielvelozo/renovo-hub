import { contarFalhas, linhaDaConferencia, relatorio } from '../../src/fumaca/relatorio'
import type { Conferencia } from '../../src/fumaca/relatorio'

// PORTA_DO_SMOKE existe pra o smoke não brigar com um wrangler dev já de pé em 8787,
// como acontece quando duas sessões mexem no mesmo repositório em worktrees diferentes.
export const PORTA = Number(process.env.PORTA_DO_SMOKE ?? 8787)

export const RAIZ = `http://127.0.0.1:${PORTA}`

export type Resposta = { status: number; corpo: any; texto: string; cabecalhos: Headers }

// O Worker fecha o keep-alive enquanto um spawnSync bloqueia o event loop; o undici
// reaproveita o socket morto e falha com ECONNRESET antes de o pedido chegar ao servidor.
export async function buscar(url: string, init?: RequestInit): Promise<Response> {
  for (let tentativa = 0; ; tentativa += 1) {
    try {
      return await fetch(url, init)
    } catch (erro) {
      const codigo = (erro as { cause?: { code?: string } }).cause?.code
      const socketMorto = codigo === 'ECONNRESET' || codigo === 'UND_ERR_SOCKET'
      if (!socketMorto || tentativa >= 2) throw erro
      await new Promise((pronto) => setTimeout(pronto, 300))
    }
  }
}

export type Pedido = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  cookie?: string | null
  formulario?: FormData
}

export type Prova = ReturnType<typeof criarProva>

export function criarProva() {
  const conferencias: Conferencia[] = []
  let grupoAtual = 'preparo'

  function grupo(titulo: string): void {
    grupoAtual = titulo
    console.log(`\n${titulo}`)
  }

  function conferir(nome: string, ok: boolean, detalhe: unknown = ''): boolean {
    const conferencia: Conferencia = { grupo: grupoAtual, nome, ok, detalhe: descrever(detalhe) }
    conferencias.push(conferencia)
    console.log(linhaDaConferencia(conferencia))

    return ok
  }

  async function api(caminho: string, pedido: Pedido = {}): Promise<Resposta> {
    const cabecalhos: Record<string, string> = {}
    if (pedido.cookie) cabecalhos.cookie = pedido.cookie
    if (pedido.corpo !== undefined) cabecalhos['content-type'] = 'application/json'

    const resposta = await buscar(RAIZ + caminho, {
      method: pedido.metodo ?? (pedido.corpo !== undefined || pedido.formulario ? 'POST' : 'GET'),
      headers: cabecalhos,
      body: pedido.formulario ?? (pedido.corpo === undefined ? undefined : JSON.stringify(pedido.corpo)),
      redirect: 'manual',
    })

    const texto = await resposta.text()

    return { status: resposta.status, corpo: comoJson(texto), texto, cabecalhos: resposta.headers }
  }

  function encerrar(): number {
    console.log(`\n${'-'.repeat(60)}\n${relatorio(conferencias)}`)

    return contarFalhas(conferencias) ? 1 : 0
  }

  return { grupo, conferir, api, conferencias, encerrar }
}

export function erroDe(resposta: Resposta): string {
  return resposta.corpo?.erro ?? resposta.texto.slice(0, 120)
}

function comoJson(texto: string): any {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

function descrever(valor: unknown): string {
  if (valor === '' || valor === undefined || valor === null) return ''

  return typeof valor === 'string' ? valor : JSON.stringify(valor)
}
