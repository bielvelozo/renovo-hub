export type Preferencia = 'automatico' | 'claro' | 'escuro'
export type Tema = 'claro' | 'escuro'

export const CHAVE_DO_TEMA = 'renovo:tema'

export const PREFERENCIAS: readonly Preferencia[] = ['automatico', 'claro', 'escuro']

const CICLO = PREFERENCIAS

const ROTULOS: Record<Preferencia, string> = {
  automatico: 'Do sistema',
  claro: 'Claro',
  escuro: 'Escuro',
}

export const COR_DA_BARRA: Record<Tema, string> = {
  escuro: '#1F1B22',
  claro: '#EFEAEC',
}

export function lerPreferencia(guardado: string | null): Preferencia {
  return CICLO.find((p) => p === guardado) ?? 'automatico'
}

export function temaEfetivo(preferencia: Preferencia, sistemaEscuro: boolean): Tema {
  if (preferencia === 'automatico') return sistemaEscuro ? 'escuro' : 'claro'
  return preferencia
}

export function proximaPreferencia(preferencia: Preferencia): Preferencia {
  return CICLO[(CICLO.indexOf(preferencia) + 1) % CICLO.length]
}

export function rotuloDaPreferencia(preferencia: Preferencia): string {
  return ROTULOS[preferencia]
}
