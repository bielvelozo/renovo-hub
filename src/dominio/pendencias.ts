import { GRUPOS, estadoEscala, ministros } from './escala'
import type { Escala, Grupo, Ministerio } from './tipos'

export const NOME_DO_GRUPO: Record<Grupo, string> = {
  vocal: 'Vocal',
  instrumentos: 'Músicos',
  tecnica: 'Som',
}

export type ChaveDePendencia = 'sem-ministro' | 'falta-funcao' | 'sem-musicas'

export type Pendencia = {
  chave: ChaveDePendencia
  texto: string
  funcaoId?: string
}

export type ResumoDeGrupo = {
  grupo: Grupo
  escalados: number
  minimo: number
  faltam: string[]
  texto: string
}

export type PendenciasDaEscala = {
  pendencias: Pendencia[]
  pronta: boolean
  porGrupo: ResumoDeGrupo[]
}

export function pendenciasDaEscala(m: Ministerio, escala: Escala): PendenciasDaEscala {
  const porGrupo = resumoPorGrupo(m, escala)

  if (estadoEscala(escala, m.hoje) !== 'agendada') return { pendencias: [], pronta: true, porGrupo }

  const pendencias: Pendencia[] = []

  if (!ministros(escala).length) pendencias.push({ chave: 'sem-ministro', texto: 'sem ministro' })

  for (const funcao of funcoesOrdenadas(m)) {
    if (funcao.minimo <= 0) continue

    const faltam = funcao.minimo - escaladosNaFuncao(escala, funcao.id)
    if (faltam <= 0) continue

    const nome = funcao.nome.toLowerCase()
    pendencias.push({
      chave: 'falta-funcao',
      texto: faltam === 1 ? `falta 1 ${nome}` : `faltam ${faltam} ${plural(nome)}`,
      funcaoId: funcao.id,
    })
  }

  if (!escala.itens.length) pendencias.push({ chave: 'sem-musicas', texto: 'sem músicas' })

  return { pendencias, pronta: pendencias.length === 0, porGrupo }
}

export function resumoPorGrupo(m: Ministerio, escala: Escala): ResumoDeGrupo[] {
  return GRUPOS.map((grupo) => {
    const funcoes = funcoesOrdenadas(m).filter((funcao) => funcao.grupo === grupo)
    const escalados = escala.equipe.filter((entrada) =>
      entrada.funcoes.some((funcaoId) => funcoes.some((funcao) => funcao.id === funcaoId)),
    ).length
    const minimo = funcoes.reduce((soma, funcao) => soma + funcao.minimo, 0)
    const faltam = funcoes
      .filter((funcao) => funcao.minimo > 0 && escaladosNaFuncao(escala, funcao.id) < funcao.minimo)
      .map((funcao) => funcao.nome.toLowerCase())

    return { grupo, escalados, minimo, faltam, texto: textoDoGrupo(grupo, escalados, minimo, faltam) }
  })
}

function textoDoGrupo(grupo: Grupo, escalados: number, minimo: number, faltam: string[]): string {
  const nome = NOME_DO_GRUPO[grupo].toLowerCase()
  if (!minimo) return `${nome} ${escalados}`

  const falta = faltam.length ? ` · ${faltam.length === 1 ? 'falta' : 'faltam'} ${faltam.join(', ')}` : ''

  return `${nome} ${escalados} de ${minimo}${falta}`
}

function escaladosNaFuncao(escala: Escala, funcaoId: string): number {
  return escala.equipe.filter((entrada) => entrada.funcoes.includes(funcaoId)).length
}

function funcoesOrdenadas(m: Ministerio) {
  return [...m.funcoes].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
}

// O plural só serve pros nomes de Função que o Admin cadastra, sempre uma palavra:
// vocal → vocais, violão → violões, som → sons.
function plural(nome: string): string {
  if (nome.endsWith('ão')) return nome.slice(0, -2) + 'ões'
  if (nome.endsWith('al')) return nome.slice(0, -2) + 'ais'
  if (nome.endsWith('el')) return nome.slice(0, -2) + 'éis'
  if (nome.endsWith('ol')) return nome.slice(0, -2) + 'óis'
  if (nome.endsWith('ul')) return nome.slice(0, -2) + 'uis'
  if (nome.endsWith('il')) return nome.slice(0, -1) + 's'
  if (nome.endsWith('m')) return nome.slice(0, -1) + 'ns'
  if (/[rsz]$/.test(nome)) return nome + 'es'
  return nome + 's'
}
