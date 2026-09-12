export type EstadoDaSugestao = 'aberta' | 'guardada' | 'aceita' | 'recusada'

export type AcaoNaSugestao = 'guardar' | 'reabrir' | 'promover' | 'recusar'

export const ESTADOS_DA_SUGESTAO: EstadoDaSugestao[] = ['aberta', 'guardada', 'aceita', 'recusada']

const TRANSICOES: Record<AcaoNaSugestao, Partial<Record<EstadoDaSugestao, EstadoDaSugestao>>> = {
  guardar: { aberta: 'guardada' },
  reabrir: { guardada: 'aberta' },
  promover: { aberta: 'aceita', guardada: 'aceita' },
  recusar: { aberta: 'recusada', guardada: 'recusada' },
}

export function transicao(estado: EstadoDaSugestao, acao: AcaoNaSugestao): EstadoDaSugestao | null {
  return TRANSICOES[acao][estado] ?? null
}

export function ehEstadoDaSugestao(valor: unknown): valor is EstadoDaSugestao {
  return typeof valor === 'string' && (ESTADOS_DA_SUGESTAO as string[]).includes(valor)
}
