import { lerConfiguracao } from '../dados/acesso'
import { marcarEnviadas, vencidas } from '../dados/notificacoes'
import type { Notificacao } from '../dados/notificacoes'
import { apagarInscricao, inscricoesDeMembros, silenciados } from '../dados/push'
import type { Ambiente } from '../tipos'
import { cargaDoAviso, enviarPush, inscricaoMorreu } from './envio'
import { gerarLembretes, gerarPosCulto } from './gatilhos'
import { chavesDeVapid } from './vapid'

export const CHAVE_DA_ORIGEM = 'origem'
export const ORIGEM_PADRAO = 'http://localhost:8787'

export type Resultado = {
  enviadas: number
  aparelhos: number
  silenciadas: number
  descartadas: number
}

export async function rodarNotificacoes(env: Ambiente, agora = new Date()): Promise<Resultado> {
  await gerarLembretes(env.DB, agora)
  await gerarPosCulto(env.DB, agora)

  return despachar(env, agora)
}

export async function despachar(env: Ambiente, agora = new Date()): Promise<Resultado> {
  const resultado: Resultado = { enviadas: 0, aparelhos: 0, silenciadas: 0, descartadas: 0 }
  const chaves = chavesDeVapid(env)
  const fila = await vencidas(env.DB, agora)
  if (!fila.length || !chaves) return resultado

  const mudos = await silenciados(env.DB)
  const inscricoes = await inscricoesDeMembros(env.DB, [...new Set(fila.map((n) => n.membroId))])
  const origem = (await lerConfiguracao(env.DB, CHAVE_DA_ORIGEM)) ?? ORIGEM_PADRAO
  const mortas = new Set<string>()

  for (const notificacao of fila) {
    if (mudos.has(notificacao.membroId)) {
      resultado.silenciadas++
      continue
    }

    const aparelhos = inscricoes.filter((x) => x.membroId === notificacao.membroId && !mortas.has(x.id))
    if (!aparelhos.length) {
      resultado.descartadas++
      continue
    }

    const carga = cargaDoAviso(avisoDe(notificacao), origem)
    let entregou = false

    for (const aparelho of aparelhos) {
      const status = await enviarComCuidado(chaves, aparelho, carga, agora)

      if (inscricaoMorreu(status)) {
        mortas.add(aparelho.id)
        await apagarInscricao(env.DB, aparelho.id)
        continue
      }

      if (status >= 200 && status < 300) {
        entregou = true
        resultado.aparelhos++
      }
    }

    if (entregou) resultado.enviadas++
  }

  await marcarEnviadas(
    env.DB,
    fila.map((n) => n.id),
    agora,
  )

  return resultado
}

function avisoDe(notificacao: Notificacao) {
  return { titulo: notificacao.titulo, corpo: notificacao.corpo, url: notificacao.url ?? '/' }
}

async function enviarComCuidado(
  chaves: Parameters<typeof enviarPush>[0],
  aparelho: Parameters<typeof enviarPush>[1],
  carga: string,
  agora: Date,
): Promise<number> {
  try {
    return await enviarPush(chaves, aparelho, carga, agora)
  } catch (erro) {
    console.error('push falhou para ' + aparelho.endpoint, erro)
    return 0
  }
}
