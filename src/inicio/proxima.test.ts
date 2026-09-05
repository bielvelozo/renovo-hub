import { describe, expect, it } from 'vitest'
import type { Anexo, EscalaResumida } from '../api/tipos'
import type { EntradaEquipe, Funcao } from '../dominio'
import { anexosPorMusica, minhaEntrada, proximaEscala, textoDaMinhaFuncao, textoDeQuemMinistra } from './proxima'

function escala(id: string, data: string, membros: string[], extra: Partial<EscalaResumida> = {}): EscalaResumida {
  return {
    id,
    data,
    horario: '18:00',
    rotulo: 'Culto de Domingo',
    santaCeia: false,
    cancelada: false,
    estado: 'agendada',
    titulo: 'Culto de Domingo 18h',
    ministros: [],
    membros,
    quantidadeNaEquipe: membros.length,
    quantidadeDeItens: 0,
    ...extra,
  }
}

const FUNCOES: Funcao[] = [
  { id: 'vocal', nome: 'vocal', naipe: 'vocal', ordem: 1 },
  { id: 'guitarra', nome: 'guitarra', naipe: 'instrumentos', ordem: 3 },
  { id: 'violao', nome: 'Violão', naipe: 'instrumentos', ordem: 4 },
  { id: 'som', nome: 'som', naipe: 'tecnica', ordem: 8 },
]

describe('próxima Escala do Membro', () => {
  it('escolhe a Agendada mais próxima em que o Membro está', () => {
    const lista = [escala('e1', '2026-09-13', ['julia']), escala('e2', '2026-09-20', ['gabriel'])]

    expect(proximaEscala(lista, 'gabriel')).toEqual({ escala: lista[1], minha: true })
  })

  it('sem Escala do Membro, cai na próxima do ministério', () => {
    const lista = [escala('e1', '2026-09-13', ['julia']), escala('e2', '2026-09-20', ['julia'])]

    expect(proximaEscala(lista, 'gabriel')).toEqual({ escala: lista[0], minha: false })
  })

  it('ignora Realizada e Cancelada', () => {
    const lista = [
      escala('velha', '2026-08-30', ['gabriel'], { estado: 'realizada' }),
      escala('morta', '2026-09-06', ['gabriel'], { estado: 'cancelada', cancelada: true }),
      escala('viva', '2026-09-13', ['gabriel']),
    ]

    expect(proximaEscala(lista, 'gabriel')?.escala.id).toBe('viva')
  })

  it('sem nenhuma Agendada devolve nada', () => {
    expect(proximaEscala([escala('velha', '2026-08-30', ['gabriel'], { estado: 'realizada' })], 'gabriel')).toBeNull()
  })

  it('desempata Escalas do mesmo dia pelo horário', () => {
    const noite = escala('noite', '2026-09-13', ['gabriel'])
    const manha = escala('manha', '2026-09-13', ['gabriel'], { horario: '08:00' })

    expect(proximaEscala([noite, manha], 'gabriel')?.escala.id).toBe('manha')
  })

  it('a lista chega em qualquer ordem e a escolha não muda', () => {
    const lista = [escala('longe', '2026-10-04', ['gabriel']), escala('perto', '2026-09-13', ['gabriel'])]

    expect(proximaEscala(lista, 'gabriel')?.escala.id).toBe('perto')
  })
})

describe('minha Função na Escala', () => {
  const equipe: EntradaEquipe[] = [
    { membroId: 'marcos', funcoes: ['vocal', 'violao'], ministro: true },
    { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
    { membroId: 'davi', funcoes: [], ministro: false },
  ]

  it('acha a entrada do Membro', () => {
    expect(minhaEntrada(equipe, 'gabriel')?.funcoes).toEqual(['guitarra'])
    expect(minhaEntrada(equipe, 'ninguem')).toBeNull()
  })

  it('escreve as Funções pelo nome, na ordem do Admin', () => {
    expect(textoDaMinhaFuncao(equipe[0], FUNCOES)).toBe('Ministro · vocal, Violão')
    expect(textoDaMinhaFuncao(equipe[1], FUNCOES)).toBe('guitarra')
  })

  it('Membro na Equipe sem Função nenhuma ainda aparece escalado', () => {
    expect(textoDaMinhaFuncao(equipe[2], FUNCOES)).toBe('sem Função definida')
  })

  it('sem a lista de Funções carregada, usa o id', () => {
    expect(textoDaMinhaFuncao(equipe[1], [])).toBe('guitarra')
  })
})

describe('quem ministra', () => {
  it('sai do grupo de Ministro da Escala', () => {
    expect(textoDeQuemMinistra([{ nome: 'Ministro', itens: ['Isa'] }])).toBe('Isa')
    expect(textoDeQuemMinistra([{ nome: 'Ministros', itens: ['Isa', 'Marcos (violão)'] }])).toBe('Isa, Marcos (violão)')
  })

  it('sem Ministro marcado devolve nada', () => {
    expect(textoDeQuemMinistra([{ nome: 'Vocal', itens: ['Ana'] }])).toBeNull()
  })
})

describe('anexos por Música', () => {
  const anexo = (id: string, musicaId: string, versao: number): Anexo => ({
    id,
    musicaId,
    nome: 'Sequência.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    tamanho: 10,
    versao,
    criadoEm: '2026-09-05T12:00:00.000Z',
    url: '/api/anexos/' + id,
  })

  it('agrupa por Música preservando a ordem recebida', () => {
    const lista = [anexo('a2', 'rio', 2), anexo('a1', 'rio', 1), anexo('b1', 'dono', 1)]

    expect(anexosPorMusica(lista)).toEqual({ rio: [lista[0], lista[1]], dono: [lista[2]] })
  })

  it('lista vazia vira mapa vazio', () => {
    expect(anexosPorMusica([])).toEqual({})
  })
})
