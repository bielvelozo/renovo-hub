import { GRUPOS, resumoDosGrupos, tempoRelativo } from '../dominio'
import type { EntradaEquipe, Funcao, Membro, Grupo, PessoaDaEquipe } from '../dominio'
import { rostoDaPessoa } from '../perfil/perfil'
import type { Rosto } from '../perfil/perfil'

export type GrupoDePessoas = { chave: Grupo | 'sem-funcao'; nome: string; pessoas: PessoaDaEquipe[] }

const NOMES_DOS_GRUPOS: Record<Grupo, string> = { vocal: 'Vocal', instrumentos: 'Músicos', tecnica: 'Som' }

export function equipePorGrupo(pessoas: PessoaDaEquipe[]): GrupoDePessoas[] {
  const grupos: GrupoDePessoas[] = GRUPOS.map((grupo) => ({
    chave: grupo,
    nome: NOMES_DOS_GRUPOS[grupo],
    pessoas: pessoas.filter((pessoa) => pessoa.grupo === grupo),
  }))

  grupos.push({ chave: 'sem-funcao', nome: 'Sem função', pessoas: pessoas.filter((pessoa) => !pessoa.grupo) })

  return grupos.filter((grupo) => grupo.pessoas.length > 0)
}

export type ChaveDaSecao = 'vocal' | 'musicos' | 'som'

export type PresencaDoMembro = { ultimaVez: string | null; seguidos: number; paradaHaMeses: number | null }

export type MembroComPush = Membro & { push?: number; silenciado?: boolean; presenca?: PresencaDoMembro }

export type LinhaDaEquipe = { total: number; rostos: Rosto[]; extras: number; texto: string }

const MAXIMO_DE_INICIAIS = 6

export function linhaDaEquipe(pessoas: PessoaDaEquipe[]): LinhaDaEquipe {
  const ministros = pessoas.filter((pessoa) => pessoa.ministro).map((pessoa) => pessoa.nome)
  const outros = pessoas.filter((pessoa) => !pessoa.ministro).map((pessoa) => pessoa.nome)
  const mostradas = pessoas.length > MAXIMO_DE_INICIAIS ? MAXIMO_DE_INICIAIS - 1 : pessoas.length
  const partes = [
    ministros.length ? `${juntarNomes(ministros)} ${ministros.length === 1 ? 'dirige' : 'dirigem'}` : '',
    outros.length ? juntarNomes(outros) : '',
  ].filter(Boolean)

  return {
    total: pessoas.length,
    rostos: pessoas.slice(0, mostradas).map(rostoDaPessoa),
    extras: pessoas.length - mostradas,
    texto: partes.join(' · '),
  }
}

export type SeloDoResumo = {
  chave: string
  texto: string
  variante: 'sucesso' | 'atencao' | 'neutro' | 'ministro'
}

export type MemoriaDoMembro = { texto: string; alerta: string | null }

export const SEGUIDOS_PARA_ALERTA = 4
export const MESES_PARADOS_PARA_ALERTA = 2
export const PESSOAS_PARA_BUSCA = 10

export type MembroDaSecao = {
  membro: MembroComPush
  funcoes: Funcao[]
}

export type SecaoDaEquipe = {
  chave: ChaveDaSecao
  grupo: Grupo
  nome: string
  membros: MembroDaSecao[]
}

export type EstadoNaEquipe = {
  funcoes: string[]
  ministro: boolean
}

const SECOES: Omit<SecaoDaEquipe, 'membros'>[] = [
  { chave: 'vocal', grupo: 'vocal', nome: 'Vocal' },
  { chave: 'musicos', grupo: 'instrumentos', nome: 'Músicos' },
  { chave: 'som', grupo: 'tecnica', nome: 'Som' },
]

export function funcoesDoMembro(membro: Membro, funcoes: Funcao[]): Funcao[] {
  return funcoes.filter((funcao) => membro.funcoes.includes(funcao.id)).sort((a, b) => a.ordem - b.ordem)
}

export function podeSerMinistro(membro: Membro): boolean {
  return membro.ministro || membro.admin
}

export function naoRecebeNotificacao(membro: MembroComPush, escalado: boolean): boolean {
  return escalado && (membro.push === 0 || membro.silenciado === true)
}

export function semNotificacao(membros: MembroComPush[], equipe: EntradaEquipe[]): string[] {
  return membros
    .filter((membro) => naoRecebeNotificacao(membro, Boolean(entradaDoMembro(equipe, membro.id))))
    .map((membro) => membro.nome)
}

export function textoDeSemNotificacao(nomes: string[]): string | null {
  if (!nomes.length) return null

  const quantas = nomes.length === 1 ? '1 pessoa' : `${nomes.length} pessoas`

  return `${quantas} sem notificação: ${nomes.join(', ')}`
}

export function memoriaDoMembro(membro: MembroComPush, hoje: string): MemoriaDoMembro {
  const presenca = membro.presenca

  return {
    texto: presenca?.ultimaVez ? `última ${tempoRelativo(presenca.ultimaVez, hoje)}` : 'nenhuma escala ainda',
    alerta: alertaDaPresenca(presenca),
  }
}

export function ordenarPorEscalados(linhas: MembroDaSecao[], equipe: EntradaEquipe[]): MembroDaSecao[] {
  const escalado = (linha: MembroDaSecao) => Number(Boolean(entradaDoMembro(equipe, linha.membro.id)))

  return [...linhas].sort(
    (a, b) => escalado(b) - escalado(a) || a.membro.nome.localeCompare(b.membro.nome),
  )
}

export function resumoDaEquipe(funcoes: Funcao[], equipe: EntradaEquipe[], membros: Membro[]): SeloDoResumo[] {
  const grupos: SeloDoResumo[] = resumoDosGrupos(funcoes, equipe).map((grupo) => ({
    chave: grupo.grupo,
    texto: grupo.texto,
    variante: grupo.faltam.length ? 'atencao' : grupo.minimo ? 'sucesso' : 'neutro',
  }))

  const nomes = equipe
    .filter((entrada) => entrada.ministro)
    .map((entrada) => membros.find((membro) => membro.id === entrada.membroId)?.nome)
    .filter((nome): nome is string => Boolean(nome))

  return [
    ...grupos,
    nomes.length
      ? {
          chave: 'ministro',
          texto: `${nomes.length === 1 ? 'ministro' : 'ministros'}: ${juntarNomes(nomes)}`,
          variante: 'ministro' as const,
        }
      : { chave: 'ministro', texto: 'sem ministro', variante: 'atencao' as const },
  ]
}

export function mensagemDaFuncao(
  nome: string,
  funcao: string,
  jaTinha: boolean,
  proximo: EstadoNaEquipe,
): string {
  if (saiDaEquipe(proximo)) return `${nome} saiu da equipe`

  return `${funcao}: ${nome} ${jaTinha ? 'saiu' : 'entrou'}`
}

export function mensagemDoMinistro(nome: string, jaEra: boolean, proximo: EstadoNaEquipe): string {
  if (saiDaEquipe(proximo)) return `${nome} saiu da equipe`

  return jaEra ? `${nome} não dirige mais` : `${nome} dirige esta escala`
}

export function secoesDaEquipe(membros: MembroComPush[], funcoes: Funcao[]): SecaoDaEquipe[] {
  const linhas = membros
    .map((membro) => ({ membro, funcoes: funcoesDoMembro(membro, funcoes) }))
    .filter((linha) => linha.funcoes.length > 0)

  return SECOES.map((secao) => ({
    ...secao,
    membros: linhas.filter((linha) => grupoQueManda(linha.funcoes) === secao.grupo),
  }))
}

export function musicosDaFormacao(membros: MembroComPush[], funcoes: Funcao[]): MembroDaSecao[] {
  return membros
    .map((membro) => ({
      membro,
      funcoes: funcoesDoMembro(membro, funcoes).filter((funcao) => funcao.grupo === 'instrumentos'),
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

function grupoQueManda(funcoes: Funcao[]): Grupo {
  if (funcoes.some((funcao) => funcao.grupo === 'vocal')) return 'vocal'
  if (funcoes.some((funcao) => funcao.grupo === 'instrumentos')) return 'instrumentos'
  return 'tecnica'
}

function alertaDaPresenca(presenca: PresencaDoMembro | undefined): string | null {
  if (!presenca) return null
  if (presenca.seguidos >= SEGUIDOS_PARA_ALERTA) return `${presenca.seguidos} seguidos`
  if ((presenca.paradaHaMeses ?? 0) >= MESES_PARADOS_PARA_ALERTA) return `${presenca.paradaHaMeses} meses sem escala`

  return null
}

function juntarNomes(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0]

  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}
