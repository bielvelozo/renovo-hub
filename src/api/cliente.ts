import { SEM_CONEXAO, mensagemDeErro } from './erros'

export class ErroDaApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroDaApi'
  }
}

export type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const temCorpo = opcoes.corpo !== undefined

  return pedir<T>(caminho, {
    method: opcoes.metodo ?? 'GET',
    headers: temCorpo ? { 'content-type': 'application/json' } : undefined,
    body: temCorpo ? JSON.stringify(opcoes.corpo) : undefined,
    signal: opcoes.sinal,
  })
}

export async function enviarArquivo<T>(caminho: string, arquivo: File, campo = 'arquivo'): Promise<T> {
  const formulario = new FormData()
  formulario.append(campo, arquivo)

  return pedir<T>(caminho, { method: 'POST', body: formulario })
}

type Pedido = RequestInit & { credentials?: 'same-origin' }

async function pedir<T>(caminho: string, opcoes: Pedido): Promise<T> {
  const pedido: Pedido = { credentials: 'same-origin', ...opcoes }
  let resposta: Response

  try {
    resposta = await fetch(caminho, pedido)
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new ErroDaApi(0, SEM_CONEXAO)
  }

  const corpo = await corpoDaResposta(resposta)

  if (!resposta.ok) throw new ErroDaApi(resposta.status, mensagemDeErro(resposta.status, corpo))

  return corpo as T
}

export function textoDoErro(erro: unknown): string {
  if (erro instanceof ErroDaApi) return erro.message
  return 'Algo deu errado por aqui. Tente de novo.'
}

async function corpoDaResposta(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}
