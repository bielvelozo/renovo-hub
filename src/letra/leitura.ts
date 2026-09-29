export type Deposito = {
  getItem: (chave: string) => string | null
  setItem: (chave: string, valor: string) => void
}

export const CHAVE_DO_TAMANHO = 'renovo:letra:tamanho'
export const CHAVE_DA_VELOCIDADE = 'renovo:letra:velocidade'

export const TAMANHOS_DA_LETRA: readonly number[] = [15, 17, 19, 21, 23, 26, 30, 34]
export const PASSO_PADRAO = 1

export const VELOCIDADE_MINIMA = 1
export const VELOCIDADE_MAXIMA = 5
export const VELOCIDADE_PADRAO = 2

// 8 px/s no padrão: uma letra de 60 linhas leva cerca de dois minutos e meio, perto
// do tempo de uma música. A sugestão original (12 × velocidade) corria a letra inteira
// em um minuto e meio já na velocidade mais lenta.
const PX_POR_SEGUNDO_NO_PASSO = 4

export function tamanhoDoPasso(passo: number): number {
  return TAMANHOS_DA_LETRA[dentroDaFaixa(passo, 0, TAMANHOS_DA_LETRA.length - 1)]
}

export function proximoPasso(passo: number): number {
  return dentroDaFaixa(passo + 1, 0, TAMANHOS_DA_LETRA.length - 1)
}

export function passoAnterior(passo: number): number {
  return dentroDaFaixa(passo - 1, 0, TAMANHOS_DA_LETRA.length - 1)
}

export function maisRapido(velocidade: number): number {
  return dentroDaFaixa(velocidade + 1, VELOCIDADE_MINIMA, VELOCIDADE_MAXIMA)
}

export function maisDevagar(velocidade: number): number {
  return dentroDaFaixa(velocidade - 1, VELOCIDADE_MINIMA, VELOCIDADE_MAXIMA)
}

export function pxPorSegundo(velocidade: number): number {
  return dentroDaFaixa(velocidade, VELOCIDADE_MINIMA, VELOCIDADE_MAXIMA) * PX_POR_SEGUNDO_NO_PASSO
}

export function lerPassoDaLetra(deposito = doAparelho()): number {
  return guardado(deposito, CHAVE_DO_TAMANHO, 0, TAMANHOS_DA_LETRA.length - 1) ?? PASSO_PADRAO
}

export function guardarPassoDaLetra(passo: number, deposito = doAparelho()): void {
  gravar(deposito, CHAVE_DO_TAMANHO, passo)
}

export function lerVelocidade(deposito = doAparelho()): number {
  return guardado(deposito, CHAVE_DA_VELOCIDADE, VELOCIDADE_MINIMA, VELOCIDADE_MAXIMA) ?? VELOCIDADE_PADRAO
}

export function guardarVelocidade(velocidade: number, deposito = doAparelho()): void {
  gravar(deposito, CHAVE_DA_VELOCIDADE, velocidade)
}

function guardado(deposito: Deposito | null, chave: string, minimo: number, maximo: number): number | null {
  try {
    const bruto = deposito?.getItem(chave)
    if (bruto === null || bruto === undefined) return null

    const numero = Number(bruto)
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) return null

    return numero
  } catch {
    return null
  }
}

function gravar(deposito: Deposito | null, chave: string, valor: number): void {
  try {
    deposito?.setItem(chave, String(valor))
  } catch {
    return
  }
}

function dentroDaFaixa(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor))
}

function doAparelho(): Deposito | null {
  try {
    return (globalThis as { localStorage?: Deposito }).localStorage ?? null
  } catch {
    return null
  }
}
