import { domingosDoMes } from '../dominio'

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
