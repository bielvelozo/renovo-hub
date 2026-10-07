import { hojeEmBrasilia, minutosEmBrasilia, somarDias } from './datas'
import { estadoEscala, membroPorId, ministros, tituloEscala } from './escala'
import { MINUTOS_DO_POS_CULTO } from './notificacoes'
import { pendenciasDaEscala } from './pendencias'
import type { Escala, Ministerio } from './tipos'

export const DIAS_DAS_PENDENCIAS = 28

export const DIAS_PARA_TRAS_NO_INICIO = 60

export type PosCulto = {
  escalaId: string
  titulo: string
  data: string
  itens: number
}

export type DadosDoInicio = {
  minhaProxima: Escala | null
  proximoCulto: Escala | null
  pendencias: Escala[]
  posCulto: PosCulto | null
  proximoMesVazio: string | null
}

export function posCultoDoMinistro(m: Ministerio, membroId: string, agora: Date): PosCulto | null {
  const hoje = hojeEmBrasilia(agora)
  const minutos = minutosEmBrasilia(agora)

  const escala = m.escalas
    .filter((e) => !e.cancelada && e.itens.length > 0 && ministros(e).includes(membroId))
    .filter((e) => janelaAberta(e.data, hoje, minutos))
    .sort((a, b) => b.data.localeCompare(a.data))[0]

  if (!escala) return null

  return { escalaId: escala.id, titulo: tituloEscala(escala), data: escala.data, itens: escala.itens.length }
}

export function dadosDoInicio(m: Ministerio, membroId: string, agora: Date): DadosDoInicio {
  const membro = membroPorId(m, membroId)
  const dirige = membro.ministro || membro.admin

  const agendadas = m.escalas
    .filter((escala) => estadoEscala(escala, m.hoje) === 'agendada')
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))

  const minhaProxima = agendadas.find((escala) => escala.equipe.some((x) => x.membroId === membroId)) ?? null
  const primeira = agendadas[0] ?? null
  const limite = somarDias(m.hoje, DIAS_DAS_PENDENCIAS)

  return {
    minhaProxima,
    proximoCulto: primeira && primeira.id !== minhaProxima?.id ? primeira : null,
    pendencias: dirige
      ? agendadas.filter((escala) => escala.data <= limite && !pendenciasDaEscala(m, escala).pronta)
      : [],
    posCulto: posCultoDoMinistro(m, membroId, agora),
    proximoMesVazio: dirige ? mesVazio(m) : null,
  }
}

function janelaAberta(data: string, hoje: string, minutos: number): boolean {
  if (data === hoje) return minutos >= MINUTOS_DO_POS_CULTO

  return somarDias(data, 1) === hoje
}

function mesVazio(m: Ministerio): string | null {
  const corrente = m.hoje.slice(0, 7)

  for (const mes of [corrente, mesSeguinte(corrente)]) {
    if (!m.escalas.some((escala) => escala.data.startsWith(mes + '-'))) return mes
  }

  return null
}

function mesSeguinte(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number)

  return numero === 12 ? `${ano + 1}-01` : `${ano}-${String(numero + 1).padStart(2, '0')}`
}
