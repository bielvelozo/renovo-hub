import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { execucoes, gruposEquipe, textoParaWhatsApp } from '../../src/dominio'
import {
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'
import { carregarMinisterio, lerEscala, lerEscalas } from './ministerio'

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarFuncao('guitarra', 'instrumentos', 3)
  await criarFuncao('som', 'tecnica', 8)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'davi', nome: 'Davi', funcoes: ['som'] })
  await criarMusica('meia-noite', 'Meia Noite', 'hRJUcvsnqKs')
  await criarMusica('firme', 'Firme Fundamento', 'FKKytz49Fhg')
})

describe('lerEscalas', () => {
  it('monta a Escala no formato do domínio, com Equipe e Repertório', async () => {
    await criarEscala({ id: 'e1', data: '2020-08-16' })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await porNaEquipe('e1', 'gabriel', ['guitarra'])
    await criarItemInteira('i1', 'e1', 'meia-noite', 'E', 1)
    await criarItemInteira('i2', 'e1', 'firme', 'C', 2)

    const escala = await lerEscala(env.DB, 'e1')

    expect(escala).toEqual({
      id: 'e1',
      data: '2020-08-16',
      horario: '18:00',
      rotulo: 'Culto de Domingo',
      santaCeia: false,
      cancelada: false,
      equipe: [
        { membroId: 'marcos', funcoes: ['vocal'], ministro: true },
        { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
      ],
      itens: [
        {
          id: 'i1',
          tipo: 'inteira',
          musicaId: 'meia-noite',
          tom: 'E',
          observacao: '',
          ministradoPor: null,
          atualizadoEm: null,
        },
        {
          id: 'i2',
          tipo: 'inteira',
          musicaId: 'firme',
          tom: 'C',
          observacao: '',
          ministradoPor: null,
          atualizadoEm: null,
        },
      ],
    })
  })

  it('devolve nulo para Escala que não existe', async () => {
    expect(await lerEscala(env.DB, 'nao-existe')).toBeNull()
  })

  it('filtra pelo mês e ordena por data', async () => {
    await criarEscala({ id: 'e2', data: '2020-09-20' })
    await criarEscala({ id: 'e1', data: '2020-09-06' })
    await criarEscala({ id: 'e0', data: '2020-08-30' })

    const escalas = await lerEscalas(env.DB, { mes: '2020-09' })

    expect(escalas.map((e) => e.id)).toEqual(['e1', 'e2'])
  })

  it('filtra por intervalo de datas, com teto aberto', async () => {
    await criarEscala({ id: 'e0', data: '2020-08-30' })
    await criarEscala({ id: 'e1', data: '2020-09-06' })
    await criarEscala({ id: 'e2', data: '2020-09-20' })

    const abertas = await lerEscalas(env.DB, { intervalo: { de: '2020-09-01' } })
    expect(abertas.map((e) => e.id)).toEqual(['e1', 'e2'])

    const fechadas = await lerEscalas(env.DB, { intervalo: { de: '2020-08-30', ate: '2020-09-06' } })
    expect(fechadas.map((e) => e.id)).toEqual(['e0', 'e1'])
  })

  it('traz Equipe e Repertório das Escalas do intervalo', async () => {
    await criarEscala({ id: 'e1', data: '2020-09-06' })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await criarItemInteira('i1', 'e1', 'meia-noite', 'E')

    const escalas = await lerEscalas(env.DB, { intervalo: { de: '2020-09-01' } })

    expect(escalas[0].equipe).toHaveLength(1)
    expect(escalas[0].itens.map((i) => i.id)).toEqual(['i1'])
  })

  it('carrega uma Escala vazia com Equipe e Repertório vazios', async () => {
    await criarEscala({ id: 'e1', data: '2020-09-06', horario: '08:00', santaCeia: true })

    const escala = await lerEscala(env.DB, 'e1')

    expect(escala).toMatchObject({ santaCeia: true, horario: '08:00', equipe: [], itens: [] })
  })
})

describe('carregarMinisterio', () => {
  it('traz Funções, Membros e Músicas junto com as Escalas pedidas', async () => {
    await criarEscala({ id: 'e1', data: '2020-08-16' })

    const m = await carregarMinisterio(env.DB, { ids: ['e1'] })

    expect(m.funcoes.map((f) => f.id)).toEqual(['vocal', 'guitarra', 'som'])
    expect(m.membros.map((x) => x.id).sort()).toEqual(['davi', 'gabriel', 'marcos'])
    expect(m.musicas.map((x) => x.id).sort()).toEqual(['firme', 'meia-noite'])
    expect(m.escalas.map((e) => e.id)).toEqual(['e1'])
    expect(m.hoje).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('alimenta as funções do domínio que a API expõe', async () => {
    await criarEscala({ id: 'e1', data: '2020-08-16' })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await porNaEquipe('e1', 'davi', ['som'])
    await criarItemInteira('i1', 'e1', 'meia-noite', 'E', 1)

    const m = await carregarMinisterio(env.DB)

    expect(gruposEquipe(m, m.escalas[0])).toEqual([
      { nome: 'Ministro', itens: ['Marcos'] },
      { nome: 'Som', itens: ['Davi'] },
    ])
    expect(textoParaWhatsApp(m, 'e1')).toContain('Meia Noite')
    expect(execucoes(m)).toHaveLength(1)
  })

  it('Escala Cancelada não gera Execução', async () => {
    await criarEscala({ id: 'e1', data: '2020-08-16', cancelada: true })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await criarItemInteira('i1', 'e1', 'meia-noite', 'E', 1)

    const m = await carregarMinisterio(env.DB)

    expect(execucoes(m)).toEqual([])
  })
})
