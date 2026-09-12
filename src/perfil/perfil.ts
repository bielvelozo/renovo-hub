import type { EscalaResumida, ProximaEscalaDoPerfil } from '../api/tipos'
import { formatarDia, hojeEmBrasilia } from '../dominio'

export function rotuloDeEscalasEmAno(quantidade: number, ano: string): string {
  return `${quantidade === 1 ? 'escala' : 'escalas'} em ${ano}`
}

export function textoDeServidos(servidos: number, de: number): string {
  return `${servidos} de ${de}`
}

export function rotuloDeServidos(de: number): string {
  return de === 1 ? 'fim de semana servido' : 'fins de semana servidos'
}

export function textoDaProximaEscala(proxima: ProximaEscalaDoPerfil | null, hoje = hojeEmBrasilia()): string {
  if (!proxima) return 'você não está em nenhuma escala agendada'

  const funcoes = proxima.funcoes.map((funcao) => funcao.toLowerCase()).join(', ')
  return funcoes ? `${formatarDia(proxima.data, hoje)} · ${funcoes}` : formatarDia(proxima.data, hoje)
}

export function textoDaUltimaEscala(ultima: EscalaResumida | null, hoje = hojeEmBrasilia()): string {
  if (!ultima) return 'nenhuma ainda'

  return formatarDia(ultima.data, hoje)
}

export function inicialDoNome(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || '?'
}
