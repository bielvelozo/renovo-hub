import { base64urlParaBytes, bytesParaBase64url } from './base64'

export type Permissao = 'default' | 'granted' | 'denied'

export type SituacaoDoPush =
  | 'sem-suporte'
  | 'precisa-instalar'
  | 'pode-ativar'
  | 'negada'
  | 'ligado'
  | 'silenciado'

export type Ambiente = {
  suportado: boolean
  instalado: boolean
  permissao: Permissao
  inscrito: boolean
  silenciado: boolean
}

export type InscricaoBruta = {
  endpoint: string
  getKey(nome: 'p256dh' | 'auth'): ArrayBuffer | null
}

export type DadosDaInscricao = {
  endpoint: string
  p256dh: string
  auth: string
}

export function situacaoDoPush(ambiente: Ambiente): SituacaoDoPush {
  if (!ambiente.suportado) return 'sem-suporte'
  if (ambiente.permissao === 'denied') return 'negada'
  if (ambiente.inscrito) return ambiente.silenciado ? 'silenciado' : 'ligado'
  if (!ambiente.instalado) return 'precisa-instalar'

  return 'pode-ativar'
}

export function textoDaSituacao(situacao: SituacaoDoPush): string {
  return TEXTOS[situacao]
}

export function podeAtivar(situacao: SituacaoDoPush): boolean {
  return situacao === 'pode-ativar'
}

export function estaLigado(situacao: SituacaoDoPush): boolean {
  return situacao === 'ligado' || situacao === 'silenciado'
}

export function chaveDoServidor(publica: string): Uint8Array<ArrayBuffer> {
  const bytes = base64urlParaBytes(publica)
  if (bytes.length !== 65 || bytes[0] !== 4) throw new Error('Chave de push inválida.')

  return bytes
}

export function dadosDaInscricao(inscricao: InscricaoBruta): DadosDaInscricao {
  const p256dh = inscricao.getKey('p256dh')
  const auth = inscricao.getKey('auth')
  if (!p256dh || !auth) throw new Error('O navegador não devolveu as chaves da inscrição.')

  return {
    endpoint: inscricao.endpoint,
    p256dh: bytesParaBase64url(p256dh),
    auth: bytesParaBase64url(auth),
  }
}

const TEXTOS: Record<SituacaoDoPush, string> = {
  'sem-suporte': 'Este navegador não recebe notificação. No iPhone, use o Safari e adicione à tela inicial.',
  'precisa-instalar':
    'Primeiro adicione o Renovo Music à tela inicial e abra por lá: no iPhone, notificação só funciona no app instalado.',
  'pode-ativar': 'Ative pra receber aviso de Escala nova, mudança no Repertório e o lembrete da véspera.',
  negada:
    'A notificação está bloqueada neste aparelho. Libere em Ajustes › Notificações › Renovo Music e volte aqui.',
  ligado: 'Este aparelho recebe as notificações do Renovo Music.',
  silenciado: 'Este aparelho está inscrito, mas você silenciou tudo. Ninguém vai te avisar até religar.',
}
