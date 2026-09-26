import type { EscalaApresentada, PosCultoApresentado, SugestaoApresentada } from '../api/tipos'
import type { PessoaDaEquipe } from '../dominio'
import { DIAS_DAS_PENDENCIAS, diasEntre, formatarDia, formatarDiaEMes, rotuloDoHorario, somarDias } from '../dominio'
import { novasDesde } from '../escalas/sugestoes'

export type ResumoDaProximaEscala = {
  suaFuncao: string | null
  ministros: string | null
  iniciais: string[]
  total: number
}

const MAXIMO_DE_INICIAIS = 6

export function chaveDoPosCultoFechado(escalaId: string): string {
  return `renovo:pos-culto-fechado:${escalaId}`
}

export function textoDoPosCulto(posCulto: PosCultoApresentado, hoje: string): string {
  const quando = posCulto.data === hoje ? 'Hoje' : 'Ontem'
  const musicas = posCulto.itens === 1 ? '1 música' : `${posCulto.itens} músicas`

  return `${quando}: ${musicas} no histórico`
}

export function tituloDasPendencias(hoje: string): string {
  return `Precisa de atenção · até ${formatarDiaEMes(somarDias(hoje, DIAS_DAS_PENDENCIAS))}`
}

export function quandoAcontece(data: string, hoje: string): string {
  const dias = diasEntre(hoje, data)

  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'amanhã'

  return `em ${dias} dias`
}

export function linhaDaEscala(escala: Pick<EscalaApresentada, 'data' | 'horario'>, hoje: string): string {
  return [formatarDia(escala.data, hoje), rotuloDoHorario(escala.horario), quandoAcontece(escala.data, hoje)].join(' · ')
}

export function resumoDaProximaEscala(pessoas: PessoaDaEquipe[], euId: string): ResumoDaProximaEscala {
  const eu = pessoas.find((pessoa) => pessoa.membroId === euId)
  const ministros = pessoas.filter((pessoa) => pessoa.ministro).map((pessoa) => pessoa.nome)

  return {
    suaFuncao: eu ? funcaoDeQuemOlha(eu) : null,
    ministros: ministros.length ? emLista(ministros) : null,
    iniciais: pessoas.slice(0, MAXIMO_DE_INICIAIS).map((pessoa) => pessoa.nome.trim().charAt(0).toUpperCase()),
    total: pessoas.length,
  }
}

function funcaoDeQuemOlha(eu: PessoaDaEquipe): string {
  const papeis = [...(eu.ministro ? ['ministro'] : []), ...eu.funcoes.map((funcao) => funcao.toLowerCase())]
  if (!papeis.length) return 'Escalado'

  const texto = papeis.join(', ')

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function emLista(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0]

  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

export function textoDeSugestoesNovas(sugestoes: SugestaoApresentada[], vistasEm: string | null): string | null {
  const novas = novasDesde(sugestoes, vistasEm)
  if (!novas.length) return null

  const quantas = novas.length === 1 ? '1 sugestão nova' : `${novas.length} sugestões novas`

  return `${quantas} · ${quemSugeriu([...new Set(novas.map((sugestao) => sugestao.membro.nome))])}`
}

function quemSugeriu(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0]
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`

  return `${nomes[0]}, ${nomes[1]} e mais ${nomes.length - 2}`
}
