import { SELF, env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execucoes } from '../../src/dominio'
import { carregarMinisterio } from '../dados/ministerio'
import { limparCacheDeVideos } from '../dados/oembed'
import { fingirRede } from '../testes/rede'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'

const RAIZ = 'http://local.test'

const PASSADO = '2020-08-16'
const FUTURO = '2099-08-16'

afterEach(() => vi.unstubAllGlobals())

beforeEach(async () => {
  limparCacheDeVideos()
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarFuncao('guitarra', 'instrumentos', 3)
  await criarFuncao('violao', 'instrumentos', 4, 'Violão')
  await criarFuncao('som', 'tecnica', 8)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal', 'violao'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'davi', nome: 'Davi', funcoes: ['som'] })
})

async function envelhecerConferencias(quando: string): Promise<void> {
  await env.DB.prepare('update videos_conferidos set conferido_em = ?').bind(quando).run()
}

async function conferenciaVelha(): Promise<number> {
  const linha = await env.DB.prepare(
    "select count(*) as n from videos_conferidos where conferido_em < '2021'",
  ).first<{ n: number }>()

  return linha?.n ?? 0
}

async function avisosNaFila(): Promise<number> {
  const linha = await env.DB.prepare('select count(*) as n from notificacoes').first<{ n: number }>()

  return linha?.n ?? 0
}

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

describe('lote do mês', () => {
  it('cria os domingos do mês com o segundo em Santa Ceia às 08h', async () => {
    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-09' }),
    })

    expect(resposta.status).toBe(201)
    const { criadas } = await resposta.json<{ criadas: Record<string, unknown>[] }>()

    expect(criadas).toHaveLength(4)
    expect(criadas.map((e) => e.data)).toEqual(['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27'])
    expect(criadas[1]).toMatchObject({ horario: '08:00', santaCeia: true, titulo: 'Santa Ceia 08h' })
    expect(
      [criadas[0], ...criadas.slice(2)].every((e) => e.horario === '18:00' && !e.santaCeia),
    ).toBe(true)
  })

  it('um mês de cinco domingos cria cinco Escalas', async () => {
    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-08' }),
    })

    const { criadas } = await resposta.json<{ criadas: unknown[] }>()

    expect(criadas).toHaveLength(5)
  })

  it('cria só os domingos que faltam', async () => {
    await criarEscala({ id: 'e0913', data: '2026-09-13' })

    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-09' }),
    })

    const corpo = await resposta.json<{ criadas: { data: string }[]; existentes: string[] }>()

    expect(corpo.criadas.map((e) => e.data)).toEqual(['2026-09-06', '2026-09-20', '2026-09-27'])
    expect(corpo.existentes).toEqual(['2026-09-13'])
  })

  it('já põe na Equipe o único Membro do Som, sem avisar ninguém', async () => {
    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2099-09' }),
    })

    const { criadas } = await resposta.json<{ criadas: { id: string }[] }>()
    const m = await carregarMinisterio(env.DB, { ids: [criadas[0].id] })

    expect(m.escalas[0].equipe).toEqual([{ membroId: 'davi', funcoes: ['som'], ministro: false }])
    expect(await avisosNaFila()).toBe(0)
  })

  it('não escala o Som quando há mais de um', async () => {
    await criarMembro({ id: 'outro', nome: 'Outro', funcoes: ['som'] })

    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: '2099-09' }),
    })

    const { criadas } = await resposta.json<{ criadas: { id: string }[] }>()
    const m = await carregarMinisterio(env.DB, { ids: [criadas[0].id] })

    expect(m.escalas[0].equipe).toEqual([])
  })

  it('recusa mês em formato inválido', async () => {
    const resposta = await pedir('/api/escalas/mes', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ mes: 'setembro' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('Membro comum não cria o mês', async () => {
    const resposta = await pedir('/api/escalas/mes', 'julia', {
      method: 'POST',
      body: JSON.stringify({ mes: '2026-09' }),
    })

    expect(resposta.status).toBe(403)
  })
})

describe('listar e ver', () => {
  it('lista o mês com estado, título e resumo da Equipe', async () => {
    await criarEscala({ id: 'e1', data: '2026-09-06', horario: '08:00', santaCeia: true })
    await criarEscala({ id: 'e2', data: '2026-09-13' })
    await criarEscala({ id: 'fora', data: '2026-10-04' })
    await porNaEquipe('e2', 'marcos', ['vocal'], true)
    await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
    await criarItemInteira('i1', 'e2', 'meia-noite', 'G', 1)

    const resposta = await pedir('/api/escalas?mes=2026-09', 'julia')
    const { escalas } = await resposta.json<{ escalas: Record<string, unknown>[] }>()

    expect(escalas).toHaveLength(2)
    expect(escalas[0]).toMatchObject({ id: 'e1', titulo: 'Santa Ceia 08h' })
    expect(escalas[1]).toMatchObject({
      id: 'e2',
      titulo: 'Culto de Domingo 18h',
      ministros: ['Marcos'],
      quantidadeDeItens: 1,
      quantidadeNaEquipe: 1,
    })
  })

  it('o resumo traz quem está na Equipe, pro Início achar a Escala do Membro', async () => {
    await criarEscala({ id: 'minha', data: FUTURO })
    await criarEscala({ id: 'alheia', data: FUTURO })
    await porNaEquipe('minha', 'julia', ['vocal'])
    await porNaEquipe('minha', 'davi', ['som'])

    const { escalas } = await (await pedir('/api/escalas', 'julia')).json<{ escalas: { id: string; membros: string[] }[] }>()

    expect(escalas.find((e) => e.id === 'minha')?.membros).toEqual(['julia', 'davi'])
    expect(escalas.find((e) => e.id === 'alheia')?.membros).toEqual([])
  })

  it('o resumo do mês traz as pendências e as Funções de quem pede', async () => {
    await criarFuncao('bateria', 'instrumentos', 5, 'Bateria', 1)
    await criarEscala({ id: 'e1', data: FUTURO })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await porNaEquipe('e1', 'julia', ['vocal'])
    await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
    await criarItemInteira('i1', 'e1', 'meia-noite', 'G', 1)

    const { escalas } = await (await pedir('/api/escalas?mes=2099-08', 'julia')).json<{
      escalas: {
        id: string
        pendencias: { chave: string; texto: string }[]
        pronta: boolean
        porGrupo: { grupo: string; texto: string }[]
        minhasFuncoes: string[]
      }[]
    }>()

    expect(escalas[0].pendencias).toEqual([
      { chave: 'falta-funcao', texto: 'falta 1 bateria', funcaoId: 'bateria' },
    ])
    expect(escalas[0].pronta).toBe(false)
    expect(escalas[0].porGrupo.map((g) => g.texto)).toEqual(['vocal 2', 'músicos 0 de 1 · falta bateria', 'som 0'])
    expect(escalas[0].minhasFuncoes).toEqual(['vocal'])
  })

  it('as Funções de quem pede vêm vazias pra quem não está na Equipe', async () => {
    await criarEscala({ id: 'e1', data: FUTURO })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)

    const { escalas } = await (await pedir('/api/escalas', 'julia')).json<{
      escalas: { minhasFuncoes: string[]; pronta: boolean }[]
    }>()

    expect(escalas[0].minhasFuncoes).toEqual([])
  })

  it('a Escala do passado aparece como Realizada e a do futuro como Agendada', async () => {
    await criarEscala({ id: 'velha', data: PASSADO })
    await criarEscala({ id: 'nova', data: FUTURO })

    const velha = await (await pedir('/api/escalas/velha', 'julia')).json<{ estado: string }>()
    const nova = await (await pedir('/api/escalas/nova', 'julia')).json<{ estado: string }>()

    expect(velha.estado).toBe('realizada')
    expect(nova.estado).toBe('agendada')
  })

  it('a Escala traz a Equipe agrupada por grupo', async () => {
    await criarEscala({ id: 'e1', data: FUTURO })
    await porNaEquipe('e1', 'marcos', ['vocal', 'violao'], true)
    await porNaEquipe('e1', 'julia', ['vocal'])
    await porNaEquipe('e1', 'davi', ['som'])

    const escala = await (await pedir('/api/escalas/e1', 'julia')).json<{ grupos: unknown[] }>()

    expect(escala.grupos).toEqual([
      { nome: 'Ministro', itens: ['Marcos (violão)'] },
      { nome: 'Vocal', itens: ['Júlia'] },
      { nome: 'Som', itens: ['Davi'] },
    ])
  })

  it('a Escala traz a memória de cada Item e o resumo do Repertório', async () => {
    await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
    await criarMusica('dono', 'Dono', '2anDhu7L-Cc')
    await criarEscala({ id: 'passada', data: PASSADO })
    await criarItemInteira('i0', 'passada', 'rio', 'G')
    await criarEscala({ id: 'e1', data: FUTURO })
    await criarItemInteira('i1', 'e1', 'rio', 'D', 0)
    await criarItemInteira('i2', 'e1', 'dono', 'F', 1)
    await criarEscala({ id: 'e2', data: '2099-08-23' })
    await criarItemInteira('i3', 'e2', 'rio', 'E')

    const escala = await (await pedir('/api/escalas/e1', 'julia')).json<{
      itens: {
        memoria: { recente: boolean; ultimaExecucao: { escalaId: string } | null; planejadaEm: { escalaId: string }[] }
      }[]
      resumoDoRepertorio: { recentes: number; antigas: number; nuncaTocadas: number; total: number }
    }>()

    expect(escala.itens[0].memoria.ultimaExecucao?.escalaId).toBe('passada')
    expect(escala.itens[0].memoria.planejadaEm.map((p) => p.escalaId)).toEqual(['e2'])
    expect(escala.itens[1].memoria.ultimaExecucao).toBeNull()
    expect(escala.resumoDoRepertorio).toEqual({ recentes: 0, antigas: 1, nuncaTocadas: 1, total: 2 })
  })

  it('a Escala traz as pendências pra faixa de estado e os anexos de letra', async () => {
    await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
    await criarEscala({ id: 'e1', data: FUTURO })
    await criarItemInteira('i1', 'e1', 'rio', 'D')

    const semMinistro = await (await pedir('/api/escalas/e1', 'julia')).json<{
      pendencias: { chave: string }[]
      pronta: boolean
      anexosPorMusica: Record<string, unknown[]>
    }>()

    expect(semMinistro.pendencias.map((p) => p.chave)).toContain('sem-ministro')
    expect(semMinistro.pronta).toBe(false)
    expect(semMinistro.anexosPorMusica).toEqual({})
  })

  it('Escala que não existe devolve 404', async () => {
    expect((await pedir('/api/escalas/nada', 'julia')).status).toBe(404)
  })

  it('sem sessão devolve 401', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/escalas?mes=2026-09`)).status).toBe(401)
  })
})

describe('Escala criada uma a uma, e edição', () => {
  it('cria a Escala com data, horário e rótulo livres', async () => {
    const resposta = await pedir('/api/escalas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ data: '2026-09-19', horario: '20:00', rotulo: 'Ensaio geral' }),
    })

    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({
      data: '2026-09-19',
      horario: '20:00',
      rotulo: 'Ensaio geral',
      titulo: 'Ensaio geral 20h',
      estado: 'agendada',
    })
  })

  it('recusa data inválida', async () => {
    const resposta = await pedir('/api/escalas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ data: '19/09/2026', horario: '20:00', rotulo: 'Ensaio' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('edita data, horário e a marca de Santa Ceia', async () => {
    await criarEscala({ id: 'e1', data: FUTURO })

    const resposta = await pedir('/api/escalas/e1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ data: '2099-08-23', horario: '08:00', santaCeia: true }),
    })

    expect(await resposta.json()).toMatchObject({
      data: '2099-08-23',
      horario: '08:00',
      santaCeia: true,
      titulo: 'Santa Ceia 08h',
    })
  })

  it('Escala Realizada continua editável', async () => {
    await criarEscala({ id: 'e1', data: PASSADO })

    const resposta = await pedir('/api/escalas/e1', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ horario: '09:00' }),
    })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({ horario: '09:00', estado: 'realizada' })
  })

  it('cancelar e desfazer voltam pelo estado que a data manda', async () => {
    await criarEscala({ id: 'e1', data: PASSADO })

    const cancelada = await pedir('/api/escalas/e1/cancelar', 'marcos', { method: 'POST' })
    expect(await cancelada.json()).toMatchObject({ estado: 'cancelada', cancelada: true })

    const desfeita = await pedir('/api/escalas/e1/desfazer', 'marcos', { method: 'POST' })
    expect(await desfeita.json()).toMatchObject({ estado: 'realizada', cancelada: false })
  })

  it('Escala Cancelada some das Execuções', async () => {
    await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
    await criarEscala({ id: 'e1', data: PASSADO })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await criarItemInteira('i1', 'e1', 'meia-noite', 'G', 1)

    expect(execucoes(await carregarMinisterio(env.DB))).toHaveLength(1)

    await pedir('/api/escalas/e1/cancelar', 'marcos', { method: 'POST' })

    expect(execucoes(await carregarMinisterio(env.DB))).toEqual([])
  })
})

describe('Equipe', () => {
  beforeEach(async () => {
    await criarEscala({ id: 'e1', data: FUTURO })
  })

  it('põe um Membro na Equipe com suas Funções', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/julia', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'] }),
    })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({
      equipe: [{ membroId: 'julia', funcoes: ['vocal'], ministro: false }],
    })
  })

  it('trocar as Funções do Membro substitui as anteriores', async () => {
    await pedir('/api/escalas/e1/equipe/marcos', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'] }),
    })

    const resposta = await pedir('/api/escalas/e1/equipe/marcos', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal', 'violao'] }),
    })

    expect(await resposta.json()).toMatchObject({
      equipe: [{ membroId: 'marcos', funcoes: ['vocal', 'violao'] }],
    })
  })

  it('tira o Membro da Equipe', async () => {
    await porNaEquipe('e1', 'julia', ['vocal'])

    const resposta = await pedir('/api/escalas/e1/equipe/julia', 'marcos', { method: 'DELETE' })

    expect(await resposta.json()).toMatchObject({ equipe: [] })
  })

  it('marca Ministro em quem tem o papel', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/marcos', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'], ministro: true }),
    })

    expect(await resposta.json()).toMatchObject({ equipe: [{ membroId: 'marcos', ministro: true }] })
  })

  it('marcar Ministro em quem não tem o papel devolve 422', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/julia', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'], ministro: true }),
    })

    expect(resposta.status).toBe(422)
    expect(await resposta.json<{ erro: string }>()).toEqual({
      erro: 'Júlia não tem o papel de Ministro. Só um Admin pode dar esse papel.',
    })
  })

  it('o Admin também recebe a marca de Ministro', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/gabriel', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['guitarra'], ministro: true }),
    })

    expect(resposta.status).toBe(200)
  })

  it('Função desconhecida devolve 422', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/julia', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['trombone'] }),
    })

    expect(resposta.status).toBe(422)
  })

  it('Membro desconhecido devolve 404', async () => {
    const resposta = await pedir('/api/escalas/e1/equipe/ninguem', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'] }),
    })

    expect(resposta.status).toBe(404)
  })

  it('a Equipe de Escala Realizada continua editável', async () => {
    await criarEscala({ id: 'passada', data: PASSADO })

    const resposta = await pedir('/api/escalas/passada/equipe/julia', 'marcos', {
      method: 'PUT',
      body: JSON.stringify({ funcoes: ['vocal'] }),
    })

    expect(resposta.status).toBe(200)
  })
})

describe('texto do WhatsApp', () => {
  it('devolve o texto pronto', async () => {
    await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
    await criarEscala({ id: 'e1', data: '2026-09-13' })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await criarItemInteira('i1', 'e1', 'meia-noite', 'G', 1)

    const corpo = await (await pedir('/api/escalas/e1/whatsapp', 'julia')).json<{ texto: string }>()

    expect(corpo.texto).toContain('*Culto de Domingo 18h · 13/09*')
    expect(corpo.texto).toContain('Ministro: Marcos')
    expect(corpo.texto).toContain('1. Meia Noite · Tom G · Canal')
  })
})

describe('playlist', () => {
  beforeEach(async () => {
    await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
    await criarMusica('firme', 'Firme Fundamento', 'FKKytz49Fhg')
    await criarEscala({ id: 'e1', data: '2026-09-13' })
    await criarItemInteira('i1', 'e1', 'meia-noite', 'G', 1)
    await criarItemInteira('i2', 'e1', 'firme', 'C', 2)
  })

  it('monta o link com os vídeos que o oEmbed confirma', async () => {
    fingirRede({
      hRJUcvsnqKs: { status: 200, corpo: { title: 'Meia Noite' } },
      FKKytz49Fhg: { status: 200, corpo: { title: 'Firme Fundamento' } },
    })

    const corpo = await (await pedir('/api/escalas/e1/playlist', 'julia')).json<{
      link: string
      videoIds: string[]
      ignorados: string[]
    }>()

    expect(corpo.link).toBe('https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,FKKytz49Fhg')
    expect(corpo.videoIds).toEqual(['hRJUcvsnqKs', 'FKKytz49Fhg'])
    expect(corpo.ignorados).toEqual([])
  })

  it('deixa de fora o vídeo que o oEmbed não conhece', async () => {
    fingirRede({
      hRJUcvsnqKs: { status: 200, corpo: { title: 'Meia Noite' } },
      FKKytz49Fhg: { status: 404 },
    })

    const corpo = await (await pedir('/api/escalas/e1/playlist', 'julia')).json<{
      link: string
      ignorados: string[]
    }>()

    expect(corpo.link).toBe('https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs')
    expect(corpo.ignorados).toEqual(['FKKytz49Fhg'])
  })

  it('guarda a conferência no banco: o segundo pedido não chama o oEmbed de novo', async () => {
    const rede = fingirRede({
      hRJUcvsnqKs: { status: 200, corpo: { title: 'Meia Noite' } },
      FKKytz49Fhg: { status: 200, corpo: { title: 'Firme Fundamento' } },
    })

    await pedir('/api/escalas/e1/playlist', 'julia')
    limparCacheDeVideos()
    const segundo = await (await pedir('/api/escalas/e1/playlist', 'julia')).json<{ link: string }>()

    expect(segundo.link).toBe('https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,FKKytz49Fhg')
    expect(rede.chamadas).toHaveLength(2)
  })

  it('reconfere o que está guardado há mais de uma semana, sem segurar a resposta', async () => {
    const rede = fingirRede({
      hRJUcvsnqKs: { status: 200, corpo: { title: 'Meia Noite' } },
      FKKytz49Fhg: { status: 200, corpo: { title: 'Firme Fundamento' } },
    })

    await pedir('/api/escalas/e1/playlist', 'julia')
    limparCacheDeVideos()
    await envelhecerConferencias('2020-01-01T00:00:00.000Z')

    const corpo = await (await pedir('/api/escalas/e1/playlist', 'julia')).json<{ link: string }>()

    expect(corpo.link).toBe('https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,FKKytz49Fhg')
    await vi.waitFor(() => expect(rede.chamadas.length).toBe(4))
    expect(await conferenciaVelha()).toBe(0)
  })

  it('devolve link nulo quando o Repertório não tem Música inteira', async () => {
    await criarEscala({ id: 'vazia', data: '2026-09-20' })

    const corpo = await (await pedir('/api/escalas/vazia/playlist', 'julia')).json<{ link: string | null }>()

    expect(corpo.link).toBeNull()
  })
})
