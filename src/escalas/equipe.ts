import type { EntradaEquipe, Funcao, Membro, Naipe } from '../dominio'

export type ChaveDaSecao = 'vocal' | 'musicos' | 'som'

export type MembroComPush = Membro & { push?: number }

export type MembroDaSecao = {
  membro: MembroComPush
  funcoes: Funcao[]
}

export type SecaoDaEquipe = {
  chave: ChaveDaSecao
  naipe: Naipe
  nome: string
  membros: MembroDaSecao[]
}

export type EstadoNaEquipe = {
  funcoes: string[]
  ministro: boolean
}

const SECOES: Omit<SecaoDaEquipe, 'membros'>[] = [
  { chave: 'vocal', naipe: 'vocal', nome: 'Vocal' },
  { chave: 'musicos', naipe: 'instrumentos', nome: 'Músicos' },
  { chave: 'som', naipe: 'tecnica', nome: 'Som' },
]

export function funcoesDoMembro(membro: Membro, funcoes: Funcao[]): Funcao[] {
  return funcoes.filter((funcao) => membro.funcoes.includes(funcao.id)).sort((a, b) => a.ordem - b.ordem)
}

export function podeSerMinistro(membro: Membro): boolean {
  return membro.ministro || membro.admin
}

export function naoRecebeNotificacao(membro: MembroComPush, escalado: boolean): boolean {
  return escalado && membro.push === 0
}

export function secoesDaEquipe(membros: MembroComPush[], funcoes: Funcao[]): SecaoDaEquipe[] {
  const linhas = membros
    .map((membro) => ({ membro, funcoes: funcoesDoMembro(membro, funcoes) }))
    .filter((linha) => linha.funcoes.length > 0)

  return SECOES.map((secao) => ({
    ...secao,
    membros: linhas.filter((linha) => naipeQueManda(linha.funcoes) === secao.naipe),
  }))
}

export function musicosDaFormacao(membros: MembroComPush[], funcoes: Funcao[]): MembroDaSecao[] {
  return membros
    .map((membro) => ({
      membro,
      funcoes: funcoesDoMembro(membro, funcoes).filter((funcao) => funcao.naipe === 'instrumentos'),
    }))
    .filter((linha) => linha.funcoes.length > 0)
}

export function alternarFuncao(atual: EstadoNaEquipe | undefined, funcaoId: string): EstadoNaEquipe {
  const funcoes = atual?.funcoes ?? []

  return {
    funcoes: funcoes.includes(funcaoId) ? funcoes.filter((id) => id !== funcaoId) : [...funcoes, funcaoId],
    ministro: atual?.ministro ?? false,
  }
}

export function alternarMinistro(atual: EstadoNaEquipe | undefined): EstadoNaEquipe {
  return { funcoes: atual?.funcoes ?? [], ministro: !(atual?.ministro ?? false) }
}

export function saiDaEquipe(estado: EstadoNaEquipe): boolean {
  return estado.funcoes.length === 0 && !estado.ministro
}

export function entradaDoMembro(equipe: EntradaEquipe[], membroId: string): EntradaEquipe | undefined {
  return equipe.find((entrada) => entrada.membroId === membroId)
}

export function comEntrada(equipe: EntradaEquipe[], membroId: string, proximo: EstadoNaEquipe): EntradaEquipe[] {
  const semEle = equipe.filter((entrada) => entrada.membroId !== membroId)
  if (saiDaEquipe(proximo)) return semEle

  const nova = { membroId, ...proximo }
  return entradaDoMembro(equipe, membroId)
    ? equipe.map((entrada) => (entrada.membroId === membroId ? nova : entrada))
    : [...equipe, nova]
}

function naipeQueManda(funcoes: Funcao[]): Naipe {
  if (funcoes.some((funcao) => funcao.naipe === 'vocal')) return 'vocal'
  if (funcoes.some((funcao) => funcao.naipe === 'instrumentos')) return 'instrumentos'
  return 'tecnica'
}
