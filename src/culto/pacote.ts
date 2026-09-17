import { api } from '../api/cliente'
import type { Pacote } from '../api/tipos'

export type Deposito = {
  getItem: (chave: string) => string | null
  setItem: (chave: string, valor: string) => void
}

export const CHAVE_DO_PACOTE = 'renovo:culto'

export const DIAS_PARA_PACOTE_VELHO = 7

const DIA_EM_MS = 24 * 60 * 60 * 1000
const AVISO = 'pacote'

const avisos = new EventTarget()

let emMemoria: Pacote | null = null

// Guardar pode faltar (navegação privada, armazenamento bloqueado) ou estourar a quota:
// quando isso acontece o pacote vale só nesta sessão, em memória, e nada quebra.
export function guardarPacote(pacote: Pacote, deposito = doAparelho()): void {
  try {
    deposito?.setItem(CHAVE_DO_PACOTE, JSON.stringify(pacote))
  } catch {
    return
  }
}

export function lerPacote(deposito = doAparelho()): Pacote | null {
  try {
    const guardado = deposito?.getItem(CHAVE_DO_PACOTE)
    return guardado ? (JSON.parse(guardado) as Pacote) : null
  } catch {
    return null
  }
}

export function idadeDoPacote(pacote: Pacote, agora: Date): number {
  const dias = (agora.getTime() - new Date(pacote.geradoEm).getTime()) / DIA_EM_MS
  return Math.max(0, Math.floor(dias))
}

export function pacoteDoAparelho(): Pacote | null {
  return emMemoria ?? lerPacote()
}

export async function baixarPacote(): Promise<Pacote> {
  const pacote = await api<Pacote>('/api/culto/pacote')

  emMemoria = pacote
  guardarPacote(pacote)
  avisos.dispatchEvent(new Event(AVISO))

  return pacote
}

export function assinarPacote(aoChegar: () => void): () => void {
  avisos.addEventListener(AVISO, aoChegar)
  return () => avisos.removeEventListener(AVISO, aoChegar)
}

function doAparelho(): Deposito | null {
  try {
    return (globalThis as { localStorage?: Deposito }).localStorage ?? null
  } catch {
    return null
  }
}
