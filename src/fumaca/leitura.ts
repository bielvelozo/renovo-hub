export function tokenDoConvite(saida: string): string | null {
  return saida.match(/\/entrar\/(\S+)/)?.[1] ?? null
}

export function cookieDaSessao(cabecalho: string | null): string | null {
  if (!cabecalho) return null

  const valor = cabecalho.match(/(?:^|[,\s])sessao=([^;,\s]+)/)?.[1]

  return valor ? `sessao=${valor}` : null
}
