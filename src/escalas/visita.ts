export function chaveDaVisita(escalaId: string): string {
  return `renovo:escala-vista:${escalaId}`
}

export function visitaNaEscala(escalaId: string): string | null {
  return localStorage.getItem(chaveDaVisita(escalaId))
}

export function marcarVisitaNaEscala(escalaId: string, agora = new Date()): void {
  localStorage.setItem(chaveDaVisita(escalaId), agora.toISOString())
}

export function mudouDesdeAVisita(atualizadoEm: string | null, visitaEm: string | null): boolean {
  if (!atualizadoEm) return false

  return !visitaEm || atualizadoEm > visitaEm
}
