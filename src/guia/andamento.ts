import { useSyncExternalStore } from 'react'
import { api } from '../api/cliente'
import type { InicioApresentado } from '../api/tipos'
import { TAREFAS, avancar } from './tarefas'
import type { Andamento, IdDaTarefa } from './tarefas'

const CHAVE = 'renovo:guia-em-andamento'

let atual: Andamento | null = lerGuardado()
const assinantes = new Set<() => void>()

function lerGuardado(): Andamento | null {
  try {
    const texto = sessionStorage.getItem(CHAVE)
    return texto ? (JSON.parse(texto) as Andamento) : null
  } catch {
    return null
  }
}

function gravar(novo: Andamento | null) {
  atual = novo
  try {
    if (novo) sessionStorage.setItem(CHAVE, JSON.stringify(novo))
    else sessionStorage.removeItem(CHAVE)
  } catch {
  }
  assinantes.forEach((avisar) => avisar())
}

function assinar(avisar: () => void) {
  assinantes.add(avisar)
  return () => assinantes.delete(avisar)
}

export function usarAndamento(): Andamento | null {
  return useSyncExternalStore(assinar, () => atual)
}

export function passarAdiante(): void {
  if (!atual) return
  const proximo = avancar(atual)
  if (!proximo) marcarTarefa(atual.tarefa)
  gravar(proximo)
}

export function sairDoGuia(): void {
  gravar(null)
}

const enviadas = new Set<IdDaTarefa>()

export function marcarTarefa(tarefa: IdDaTarefa): void {
  if (enviadas.has(tarefa)) return
  enviadas.add(tarefa)
  api('/api/guia/feitas', { metodo: 'POST', corpo: { tarefa } }).catch(() => enviadas.delete(tarefa))
}

export async function comecarTarefa(id: IdDaTarefa, navegar: (caminho: string) => void, dirige: boolean): Promise<string | null> {
  const { comeco } = TAREFAS[id]
  let caminho: string

  if (comeco.tipo === 'rota') {
    caminho = comeco.caminho
  } else {
    const inicio = await api<InicioApresentado>('/api/inicio')
    const escala = inicio.minhaProxima ?? inicio.proximoCulto
    if (!escala) {
      return dirige
        ? 'Ainda não tem escala marcada. Comece criando as escalas do mês.'
        : 'Você ainda não está em nenhuma escala.'
    }
    caminho = comeco.tipo === 'culto' ? `/culto/${escala.id}` : `/escalas/${escala.id}${comeco.sufixo}`
  }

  gravar({ tarefa: id, passo: 0 })
  navegar(caminho)
  return null
}
