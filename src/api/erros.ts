export const SEM_CONEXAO = 'Sem conexão com o Renovo Music. Verifique a internet e tente de novo.'

const POR_STATUS: Record<number, string> = {
  0: SEM_CONEXAO,
  400: 'Não foi possível processar o pedido.',
  401: 'Entre pelo seu link de convite.',
  403: 'Você não tem permissão pra fazer isso.',
  404: 'Não foi possível encontrar o que você pediu.',
  409: 'Isso não dá pra fazer agora.',
  413: 'Arquivo grande demais.',
  422: 'Confira os campos e tente de novo.',
}

export function mensagemDeErro(status: number, corpo: unknown): string {
  const doWorker = textoDoCorpo(corpo)
  if (doWorker) return doWorker
  if (POR_STATUS[status]) return POR_STATUS[status]
  if (status >= 500) return 'Algo deu errado. Tente de novo.'
  return 'Não foi possível concluir. Tente de novo.'
}

export function precisaEntrar(status: number): boolean {
  return status === 401
}

function textoDoCorpo(corpo: unknown): string | null {
  if (typeof corpo !== 'object' || corpo === null) return null
  const { erro } = corpo as { erro?: unknown }
  return typeof erro === 'string' && erro ? erro : null
}
