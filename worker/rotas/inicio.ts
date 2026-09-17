import { Hono } from 'hono'
import { DIAS_PARA_TRAS_NO_INICIO, dadosDoInicio, hojeEmBrasilia, musicasDoItem, somarDias } from '../../src/dominio'
import type { Escala } from '../../src/dominio'
import { exigirMembro } from '../autenticacao'
import { anexosPorDono, lerAnexosDeItens, lerAnexosDeMusicas } from '../dados/anexos'
import { lerSemanasDeRepeticao } from '../dados/configuracoes'
import { carregarMinisterio } from '../dados/ministerio'
import { apresentarEscala, resumirEscala } from '../http/escala'
import type { Contexto } from '../tipos'

export const inicio = new Hono<Contexto>()

inicio.get('/api/inicio', exigirMembro, async (c) => {
  const eu = c.get('membro')
  const de = somarDias(hojeEmBrasilia(), -DIAS_PARA_TRAS_NO_INICIO)

  const [m, semanasDeRepeticao] = await Promise.all([
    carregarMinisterio(c.env.DB, { intervalo: { de } }),
    lerSemanasDeRepeticao(c.env.DB),
  ])

  const dados = dadosDoInicio(m, eu.id, new Date())
  const mostradas = [dados.minhaProxima, dados.proximoCulto].filter((escala) => escala !== null)
  const [deMusicas, deItens] = await Promise.all([
    lerAnexosDeMusicas(c.env.DB, musicasDe(mostradas)),
    lerAnexosDeItens(c.env.DB, medleysDe(mostradas)),
  ])

  return c.json({
    minhaProxima: dados.minhaProxima && apresentarEscala(m, dados.minhaProxima, semanasDeRepeticao),
    proximoCulto: dados.proximoCulto && apresentarEscala(m, dados.proximoCulto, semanasDeRepeticao),
    pendencias: dados.pendencias.map((escala) => resumirEscala(m, escala, eu.id)),
    posCulto: dados.posCulto,
    anexosPorDono: anexosPorDono([...deMusicas, ...deItens]),
    semanasDeRepeticao,
    proximoMesVazio: dados.proximoMesVazio,
  })
})

function musicasDe(escalas: Escala[]): string[] {
  return [...new Set(escalas.flatMap((escala) => escala.itens.flatMap(musicasDoItem)))]
}

function medleysDe(escalas: Escala[]): string[] {
  return escalas.flatMap((escala) => escala.itens.filter((item) => item.tipo === 'medley').map((item) => item.id))
}
