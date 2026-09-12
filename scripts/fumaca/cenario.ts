import { hojeEmBrasilia, somarDias } from '../../src/dominio'
import { dataDeslocada } from '../../src/semente/demonstracao'
import { erroDe } from './prova'
import type { Prova, Resposta } from './prova'

export const VIDEOS = {
  meiaNoite: 'hRJUcvsnqKs',
  firme: 'FKKytz49Fhg',
  grato: 'Yo9G3hvl_UI',
  permanecerei: '0qTF7saPK7o',
  emTeusBracos: 'IxpWNuxGmzc',
  sublime: '7GWZwO0MdsY',
  rio: 's1oU-6vYc4E',
  dono: '2anDhu7L-Cc',
  benditoEhORei: 'CmM1pcHohdI',
}

export type Cenario = {
  raiz: string
  gabriel: string
  isa: string
  julia: string
  mesDeTrabalho: string
  escalaDoMes: string
  escalaSobrando: string
  musicas: Map<string, string>
  hoje: string
}

export function mesSeguinte(hoje: string): string {
  const [ano, mes] = hoje.split('-').map(Number)

  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`
}

export function mesAnterior(hoje: string): string {
  const [ano, mes] = hoje.split('-').map(Number)

  return mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, '0')}`
}

export function proximoSabado(hoje: string): string {
  let data = somarDias(hoje, 1)

  while (new Date(`${data}T12:00:00Z`).getUTCDay() !== 6) data = somarDias(data, 1)

  return data
}

export function hojeDoAmbiente(): string {
  return hojeEmBrasilia()
}

// A demonstração desloca as datas de exemplo pra girarem em torno de hoje; os roteiros
// pedem a Escala pela data fixa do exemplo e deixam o deslocamento com esta função.
export function dataDaDemonstracao(dataFixa: string): string {
  return dataDeslocada(dataFixa, hojeDoAmbiente())
}

export async function musicasPorVideo(prova: Prova, cookie: string): Promise<Map<string, string>> {
  const resposta = await prova.api('/api/musicas?arquivadas=1', { cookie })

  return new Map<string, string>(
    (resposta.corpo?.musicas ?? []).map((musica: { videoId: string; id: string }) => [musica.videoId, musica.id]),
  )
}

export async function escalaPorRotulo(prova: Prova, cookie: string, rotulo: string): Promise<any> {
  const hoje = hojeDoAmbiente()

  for (const mes of [mesAnterior(hoje), hoje.slice(0, 7), mesSeguinte(hoje)]) {
    const resposta = await prova.api(`/api/escalas?mes=${mes}`, { cookie })
    const achada = (resposta.corpo?.escalas ?? []).find((escala: { rotulo: string }) => escala.rotulo === rotulo)

    if (achada) return achada
  }

  throw new Error(`Não achei a Escala «${rotulo}». O seed --demo rodou?`)
}

export async function escalaPorData(prova: Prova, cookie: string, data: string): Promise<any> {
  const mes = data.slice(0, 7)
  const resposta = await prova.api(`/api/escalas?mes=${mes}`, { cookie })
  const achada = (resposta.corpo?.escalas ?? []).find((escala: { data: string }) => escala.data === data)

  if (!achada) throw new Error(`Não achei a Escala de ${data}. O seed --demo rodou?`)

  return achada
}

export function exigir(resposta: Resposta, status: number, oQue: string): any {
  if (resposta.status !== status) {
    throw new Error(`${oQue}: esperava ${status}, veio ${resposta.status} — ${erroDe(resposta)}`)
  }

  return resposta.corpo
}

export function itemPorId(escala: any, itemId: string): any {
  return (escala?.itens ?? []).find((item: { id: string }) => item.id === itemId)
}

export function ultimoItem(escala: any): any {
  return escala?.itens?.[escala.itens.length - 1]
}

export function grupo(escala: any, nome: string): string[] {
  return (escala?.grupos ?? []).find((g: { nome: string }) => g.nome === nome)?.itens ?? []
}
