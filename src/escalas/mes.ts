import type { EscalaResumida } from '../api/tipos'
import { domingosDoMes, rotuloDoHorario } from '../dominio'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function partes(mes: string): [number, number] {
  const [ano, numero] = mes.split('-').map(Number)
  return [ano, numero]
}

export function mesDaData(data: string): string {
  return data.slice(0, 7)
}

export function deslocarMes(mes: string, passos: number): string {
  const [ano, numero] = partes(mes)
  const total = ano * 12 + (numero - 1) + passos
  return Math.floor(total / 12) + '-' + String((total % 12) + 1).padStart(2, '0')
}

export function nomeDoMes(mes: string): string {
  return MESES[partes(mes)[1] - 1]
}

export function rotuloDoMes(mes: string): string {
  return nomeDoMes(mes) + ' ' + partes(mes)[0]
}

export function domingosQueFaltam(mes: string, datas: string[]): string[] {
  const [ano, numero] = partes(mes)
  return domingosDoMes(ano, numero).filter((domingo) => !datas.includes(domingo))
}

export type SeloDoMes = {
  chave: string
  texto: string
  variante: 'ceia' | 'destaque' | 'cancelada' | 'sucesso' | 'atencao'
}

export type LinhaDoMes = { tipo: 'escala'; escala: EscalaResumida; hoje: boolean } | { tipo: 'nada'; data: string }

export function dicaDaEscala(escala: EscalaResumida): string {
  const musicas =
    escala.quantidadeDeItens === 0
      ? 'sem músicas'
      : `${escala.quantidadeDeItens} ${escala.quantidadeDeItens === 1 ? 'música' : 'músicas'}`

  return [rotuloDoHorario(escala.horario), escala.ministros.join(', '), musicas].filter(Boolean).join(' · ')
}

export function selosDaEscala(escala: EscalaResumida, dirige: boolean): SeloDoMes[] {
  const selos: SeloDoMes[] = []

  if (escala.santaCeia) selos.push({ chave: 'ceia', texto: 'santa ceia', variante: 'ceia' })

  if (escala.minhasFuncoes.length) {
    selos.push({
      chave: 'voce',
      texto: `você · ${escala.minhasFuncoes.map((funcao) => funcao.toLowerCase()).join(', ')}`,
      variante: 'destaque',
    })
  }

  if (escala.estado === 'cancelada') {
    selos.push({ chave: 'cancelada', texto: 'cancelada', variante: 'cancelada' })
    return selos
  }

  if (!dirige || escala.estado !== 'agendada') return selos

  if (escala.pronta) selos.push({ chave: 'pronta', texto: 'pronta', variante: 'sucesso' })

  for (const pendencia of escala.pendencias) {
    selos.push({ chave: pendencia.chave + (pendencia.funcaoId ?? ''), texto: pendencia.texto, variante: 'atencao' })
  }

  return selos
}

export function linhasDoMes(escalas: EscalaResumida[], mes: string, hoje: string): LinhaDoMes[] {
  const ordenadas = [...escalas].sort((a, b) => a.data.localeCompare(b.data))
  const linhas: LinhaDoMes[] = ordenadas.map((escala) => ({
    tipo: 'escala' as const,
    escala,
    hoje: escala.data === hoje,
  }))

  if (mesDaData(hoje) !== mes || ordenadas.some((escala) => escala.data === hoje)) return linhas

  const posicao = ordenadas.findIndex((escala) => escala.data > hoje)
  linhas.splice(posicao === -1 ? linhas.length : posicao, 0, { tipo: 'nada', data: hoje })

  return linhas
}

export function textoDeCriarDomingos(quantos: number, mes: string, vazio: boolean): string {
  const onde = vazio ? `de ${nomeDoMes(mes).toLowerCase()}` : quantos === 1 ? 'que falta' : 'que faltam'

  return quantos === 1 ? `Criar o domingo ${onde}` : `Criar os ${quantos} domingos ${onde}`
}
