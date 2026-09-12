import {
  MINUTOS_DO_POS_CULTO,
  avisoDeCancelada,
  avisoDeEscalado,
  avisoDeLembrete,
  avisoDeMudanca,
  avisoDePosCulto,
  avisoDeRemarcada,
  avisoDeVariasMudancas,
  dataDoLembrete,
  estadoEscala,
  hojeEmBrasilia,
  ministros,
  minutosEmBrasilia,
} from '../../src/dominio'
import type { AcaoNaMusica, Aviso, Escala, Ministerio, TipoDeNotificacao } from '../../src/dominio'
import { enfileirar, jaTeve, pendenteDe, regravarAviso, ultimoEnvio } from '../dados/notificacoes'
import { carregarMinisterio } from '../dados/ministerio'

export const JANELA_DE_AGRUPAMENTO = 60 * 60 * 1000

export function ehAgendada(m: Ministerio, escala: Escala): boolean {
  return estadoEscala(escala, m.hoje) === 'agendada'
}

export async function avisarEscalados(
  db: D1Database,
  m: Ministerio,
  escala: Escala,
  membroIds: string[],
  agora: Date,
): Promise<void> {
  if (!ehAgendada(m, escala)) return

  for (const membroId of membroIds) {
    const entrada = escala.equipe.find((x) => x.membroId === membroId)
    if (!entrada || (!entrada.funcoes.length && !entrada.ministro)) continue
    if (await jaTeve(db, membroId, 'escalado', escala.id)) continue

    await enfileirar(
      db,
      {
        membroId,
        tipo: 'escalado',
        escalaId: escala.id,
        aviso: avisoDeEscalado(m, escala, membroId),
        enviarApos: agora.toISOString(),
      },
      agora,
    )
  }
}

// Um push por hora por Escala: enquanto houver pendente, a mudança nova entra
// nela; logo depois de um envio, a próxima espera fechar a janela.
export async function avisarMudancaDeMusica(
  db: D1Database,
  m: Ministerio,
  escala: Escala,
  mudanca: { acao: AcaoNaMusica; descricao: string },
  autorId: string | null,
  agora: Date,
): Promise<void> {
  if (!ehAgendada(m, escala)) return

  const destinatarios = escala.equipe.map((x) => x.membroId).filter((id) => id !== autorId)

  for (const membroId of destinatarios) {
    const pendente = await pendenteDe(db, membroId, 'musica', escala.id)

    if (pendente) {
      const mudancas = pendente.mudancas + 1
      await regravarAviso(db, pendente.id, avisoDeVariasMudancas(escala, mudancas), mudancas)
      continue
    }

    const enviada = await ultimoEnvio(db, membroId, 'musica', escala.id)
    const liberaEm = enviada ? new Date(Date.parse(enviada) + JANELA_DE_AGRUPAMENTO) : agora

    await enfileirar(
      db,
      {
        membroId,
        tipo: 'musica',
        escalaId: escala.id,
        aviso: avisoDeMudanca(escala, mudanca.acao, mudanca.descricao),
        enviarApos: (liberaEm > agora ? liberaEm : agora).toISOString(),
        mudancas: 1,
      },
      agora,
    )
  }
}

export async function avisarCancelada(
  db: D1Database,
  m: Ministerio,
  escala: Escala,
  agora: Date,
): Promise<void> {
  await avisarEquipe(db, m, escala, 'cancelada', avisoDeCancelada(escala), agora)
}

export async function avisarRemarcada(
  db: D1Database,
  m: Ministerio,
  antes: Escala,
  depois: Escala,
  agora: Date,
): Promise<void> {
  await avisarEquipe(db, m, antes, 'remarcada', avisoDeRemarcada(depois), agora)
}

export async function avisarAutorDaSugestao(
  db: D1Database,
  sugestao: { membroId: string },
  tipo: Extract<TipoDeNotificacao, `sugestao-${string}`>,
  aviso: Aviso,
  escalaId: string | null,
  decididoPor: string,
  agora: Date,
): Promise<void> {
  if (sugestao.membroId === decididoPor) return

  await enfileirar(
    db,
    { membroId: sugestao.membroId, tipo, escalaId, aviso, enviarApos: agora.toISOString() },
    agora,
  )
}

export async function gerarLembretes(db: D1Database, agora: Date): Promise<number> {
  const data = dataDoLembrete(agora)
  if (!data) return 0

  const m = await carregarMinisterio(db, { mes: data.slice(0, 7) })
  let criados = 0

  for (const escala of m.escalas) {
    if (escala.data !== data || escala.cancelada) continue

    for (const entrada of escala.equipe) {
      if (await jaTeve(db, entrada.membroId, 'lembrete', escala.id)) continue

      await enfileirar(
        db,
        {
          membroId: entrada.membroId,
          tipo: 'lembrete',
          escalaId: escala.id,
          aviso: avisoDeLembrete(escala, escala.itens.length),
          enviarApos: agora.toISOString(),
        },
        agora,
      )
      criados++
    }
  }

  return criados
}

// Lembrete de fim de culto: não filtra por estado, porque a Escala de hoje só
// vira Realizada à meia-noite e o cartão precisa aparecer nesta noite.
export async function gerarPosCulto(db: D1Database, agora: Date): Promise<number> {
  if (minutosEmBrasilia(agora) < MINUTOS_DO_POS_CULTO) return 0

  const hoje = hojeEmBrasilia(agora)
  const m = await carregarMinisterio(db, { mes: hoje.slice(0, 7) })
  let criados = 0

  for (const escala of m.escalas) {
    if (escala.data !== hoje || escala.cancelada || !escala.itens.length) continue

    for (const membroId of ministros(escala)) {
      if (await jaTeve(db, membroId, 'pos-culto', escala.id)) continue

      await enfileirar(
        db,
        {
          membroId,
          tipo: 'pos-culto',
          escalaId: escala.id,
          aviso: avisoDePosCulto(escala, escala.itens.length),
          enviarApos: agora.toISOString(),
        },
        agora,
      )
      criados++
    }
  }

  return criados
}

async function avisarEquipe(
  db: D1Database,
  m: Ministerio,
  escala: Escala,
  tipo: 'cancelada' | 'remarcada',
  aviso: ReturnType<typeof avisoDeCancelada>,
  agora: Date,
): Promise<void> {
  if (!ehAgendada(m, escala)) return

  for (const entrada of escala.equipe) {
    await enfileirar(
      db,
      {
        membroId: entrada.membroId,
        tipo,
        escalaId: escala.id,
        aviso,
        enviarApos: agora.toISOString(),
      },
      agora,
    )
  }
}
