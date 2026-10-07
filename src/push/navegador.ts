import { api } from '../api/cliente'
import { chaveDoServidor, dadosDaInscricao } from './push'
import type { Permissao } from './push'

export function suportaPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function estaInstalado(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true

  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function permissaoAtual(): Permissao {
  if (!('Notification' in window)) return 'default'

  return Notification.permission as Permissao
}

export async function inscricaoAtual(): Promise<PushSubscription | null> {
  if (!suportaPush()) return null

  const registro = await navigator.serviceWorker.ready

  return registro.pushManager.getSubscription()
}

// Reenvia a inscrição a cada abertura: a Apple não documenta quando o sistema a
// troca sozinha, e o endpoint velho só some do banco quando o push volta 410.
export async function reenviarInscricao(): Promise<boolean> {
  const inscricao = await inscricaoAtual()
  if (!inscricao) return false

  await api('/api/push/inscrever', { metodo: 'POST', corpo: dadosDaInscricao(inscricao) })

  return true
}

export async function ativarPush(): Promise<void> {
  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') throw new Error('Você não liberou as notificações neste aparelho.')

  const { chave } = await api<{ chave: string | null }>('/api/push/chave')
  if (!chave) throw new Error('Não foi possível ativar as notificações.')

  const registro = await navigator.serviceWorker.ready
  const inscricao =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveDoServidor(chave),
    }))

  await api('/api/push/inscrever', { metodo: 'POST', corpo: dadosDaInscricao(inscricao) })
}

export async function desligarPush(): Promise<void> {
  const inscricao = await inscricaoAtual()
  if (!inscricao) return

  await api('/api/push/desinscrever', { metodo: 'POST', corpo: { endpoint: inscricao.endpoint } })
  await inscricao.unsubscribe()
}

export async function enviarPushDeTeste(): Promise<number> {
  const { aparelhos } = await api<{ aparelhos: number }>('/api/push/teste', { metodo: 'POST', corpo: {} })

  return aparelhos
}

export async function silenciar(silenciado: boolean): Promise<void> {
  await api('/api/push/silenciar', { metodo: 'POST', corpo: { silenciado } })
}
