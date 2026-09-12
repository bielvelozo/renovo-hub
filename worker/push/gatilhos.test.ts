import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { carregarMinisterio } from '../dados/ministerio'
import { marcarEnviadas, vencidas } from '../dados/notificacoes'
import {
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'
import { JANELA_DE_AGRUPAMENTO, avisarCancelada, avisarEscalados, avisarMudancaDeMusica, avisarRemarcada, gerarLembretes } from './gatilhos'

const AGORA = new Date('2026-09-05T15:00:00.000Z')
const FUTURA = '2099-09-13'
const PASSADA = '2020-09-13'

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarFuncao('baixo', 'instrumentos', 2, 'Baixo')
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['baixo'] })
})

describe('avisarEscalados', () => {
  it('enfileira pra quem entrou numa Escala Agendada', async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'julia', ['vocal'])

    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)

    const fila = await vencidas(env.DB, AGORA)
    expect(fila).toHaveLength(1)
    expect(fila[0]).toMatchObject({ membroId: 'julia', tipo: 'escalado', escalaId: 'futura' })
    expect(fila[0].corpo).toContain('no vocal')
  })

  it('não enfileira nada em Escala Realizada', async () => {
    await criarEscala({ id: 'passada', data: PASSADA })
    await porNaEquipe('passada', 'julia', ['vocal'])

    const m = await carregarMinisterio(env.DB, { ids: ['passada'] })
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)

    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })

  it('não enfileira nada em Escala Cancelada', async () => {
    await criarEscala({ id: 'futura', data: FUTURA, cancelada: true })
    await porNaEquipe('futura', 'julia', ['vocal'])

    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)

    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })

  it('manda um push por Escala por Membro, mesmo trocando a Função depois', async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'julia', ['vocal'])

    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)

    expect(await vencidas(env.DB, AGORA)).toHaveLength(1)
  })

  it('ignora quem ficou sem Função nenhuma e sem a marca de Ministro', async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'julia', [])

    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarEscalados(env.DB, m, m.escalas[0], ['julia'], AGORA)

    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })
})

describe('avisarMudancaDeMusica', () => {
  beforeEach(async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'marcos', ['vocal'], true)
    await porNaEquipe('futura', 'julia', ['vocal'])
    await criarMusica('m1', 'Meia Noite', 'v1')
    await criarItemInteira('i1', 'futura', 'm1', 'G')
  })

  it('avisa a Equipe menos quem fez a mudança', async () => {
    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarMudancaDeMusica(
      env.DB,
      m,
      m.escalas[0],
      { acao: 'entrou', descricao: 'Meia Noite (Tom G)' },
      'marcos',
      AGORA,
    )

    const fila = await vencidas(env.DB, AGORA)
    expect(fila.map((n) => n.membroId)).toEqual(['julia'])
    expect(fila[0].corpo).toBe('Meia Noite (Tom G) entrou na Escala de dom, 13 de set de 2099')
  })

  it('agrupa as mudanças seguintes na mesma notificação pendente', async () => {
    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    const mudar = (descricao: string) =>
      avisarMudancaDeMusica(env.DB, m, m.escalas[0], { acao: 'entrou', descricao }, 'marcos', AGORA)

    await mudar('Meia Noite (Tom G)')
    await mudar('Sublime (Tom D)')
    await mudar('Lugar Secreto (Tom A)')

    const fila = await vencidas(env.DB, AGORA)
    expect(fila).toHaveLength(1)
    expect(fila[0].corpo).toBe('3 mudanças na Escala de dom, 13 de set de 2099')
    expect(fila[0].mudancas).toBe(3)
  })

  it('segura a mudança seguinte até fechar a janela de uma hora', async () => {
    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarMudancaDeMusica(env.DB, m, m.escalas[0], { acao: 'entrou', descricao: 'Meia Noite (Tom G)' }, 'marcos', AGORA)

    const primeira = await vencidas(env.DB, AGORA)
    await marcarEnviadas(env.DB, [primeira[0].id], AGORA)

    const dezMinutosDepois = new Date(AGORA.getTime() + 10 * 60 * 1000)
    await avisarMudancaDeMusica(env.DB, m, m.escalas[0], { acao: 'saiu', descricao: 'Sublime' }, 'marcos', dezMinutosDepois)

    expect(await vencidas(env.DB, dezMinutosDepois)).toHaveLength(0)
    expect(await vencidas(env.DB, new Date(AGORA.getTime() + JANELA_DE_AGRUPAMENTO))).toHaveLength(1)
  })

  it('não avisa mudança em Escala Realizada', async () => {
    await criarEscala({ id: 'passada', data: PASSADA })
    await porNaEquipe('passada', 'julia', ['vocal'])

    const m = await carregarMinisterio(env.DB, { ids: ['passada'] })
    await avisarMudancaDeMusica(env.DB, m, m.escalas[0], { acao: 'entrou', descricao: 'Meia Noite (Tom G)' }, 'marcos', AGORA)

    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })
})

describe('avisarCancelada e avisarRemarcada', () => {
  beforeEach(async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'marcos', ['vocal'], true)
    await porNaEquipe('futura', 'julia', ['vocal'])
  })

  it('avisa a Equipe inteira do cancelamento, na hora', async () => {
    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    await avisarCancelada(env.DB, m, m.escalas[0], AGORA)

    const fila = await vencidas(env.DB, AGORA)
    expect(fila).toHaveLength(2)
    expect(fila[0].tipo).toBe('cancelada')
    expect(fila[0].corpo).toBe('Culto de Domingo de dom, 13 de set de 2099 cancelado')
  })

  it('avisa a data nova quando remarca', async () => {
    const m = await carregarMinisterio(env.DB, { ids: ['futura'] })
    const depois = { ...m.escalas[0], data: '2099-09-20', horario: '08:00' }
    await avisarRemarcada(env.DB, m, m.escalas[0], depois, AGORA)

    const fila = await vencidas(env.DB, AGORA)
    expect(fila).toHaveLength(2)
    expect(fila[0].corpo).toBe('Culto de Domingo mudou para dom, 20 de set de 2099, 08h')
  })
})

describe('gerarLembretes', () => {
  const dezDaManha = (data: string) => new Date(`${data}T13:00:00.000Z`)

  beforeEach(async () => {
    await criarEscala({ id: 'e0913', data: '2099-09-13' })
    await porNaEquipe('e0913', 'marcos', ['vocal'], true)
    await porNaEquipe('e0913', 'julia', ['vocal'])
    await criarMusica('m1', 'Meia Noite', 'v1')
    await criarItemInteira('i1', 'e0913', 'm1', 'G')
  })

  it('enfileira na véspera, às 10h de Brasília, pra Equipe toda', async () => {
    const agora = dezDaManha('2099-09-12')
    expect(await gerarLembretes(env.DB, agora)).toBe(2)

    const fila = await vencidas(env.DB, agora)
    expect(fila.map((n) => n.membroId).sort()).toEqual(['julia', 'marcos'])
    expect(fila[0].corpo).toBe('Amanhã 18h: Escala com 1 música. Toque pra ver os Tons.')
  })

  it('não enfileira dois dias antes', async () => {
    expect(await gerarLembretes(env.DB, dezDaManha('2099-09-11'))).toBe(0)
  })

  it('não enfileira antes das 10h da véspera', async () => {
    expect(await gerarLembretes(env.DB, new Date('2099-09-12T12:00:00.000Z'))).toBe(0)
  })

  it('não repete o lembrete nas rodadas seguintes do cron', async () => {
    const agora = dezDaManha('2099-09-12')
    await gerarLembretes(env.DB, agora)

    expect(await gerarLembretes(env.DB, new Date(agora.getTime() + 15 * 60 * 1000))).toBe(0)
    expect(await vencidas(env.DB, agora)).toHaveLength(2)
  })

  it('não lembra de Escala Cancelada', async () => {
    await env.DB.prepare('update escalas set cancelada = 1 where id = ?').bind('e0913').run()

    expect(await gerarLembretes(env.DB, dezDaManha('2099-09-12'))).toBe(0)
  })
})
