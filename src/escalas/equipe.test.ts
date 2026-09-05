import { describe, expect, it } from 'vitest'
import { FUNCOES, ministerioDeExemplo } from '../dominio'
import type { Membro } from '../dominio'
import {
  alternarFuncao,
  alternarMinistro,
  comEntrada,
  entradaDoMembro,
  funcoesDoMembro,
  naoRecebeNotificacao,
  podeSerMinistro,
  saiDaEquipe,
  secoesDaEquipe,
} from './equipe'

const m = ministerioDeExemplo()
const secoes = () => secoesDaEquipe(m.membros, FUNCOES)
const secao = (chave: string) => secoes().find((s) => s.chave === chave)!
const nomes = (chave: string) => secao(chave).membros.map((linha) => linha.membro.nome)

describe('secoesDaEquipe', () => {
  it('devolve as três seções na ordem Vocal, Músicos, Som', () => {
    expect(secoes().map((s) => s.nome)).toEqual(['Vocal', 'Músicos', 'Som'])
  })

  it('põe quem canta no Vocal, mesmo quem também toca', () => {
    expect(nomes('vocal')).toContain('Marcos')
    expect(nomes('musicos')).not.toContain('Marcos')
  })

  it('põe no Som quem só tem Função técnica', () => {
    expect(nomes('som')).toEqual(['Davi'])
  })

  it('deixa cada Membro em uma seção só', () => {
    const todos = secoes().flatMap((s) => s.membros.map((linha) => linha.membro.id))
    expect(new Set(todos).size).toBe(todos.length)
  })

  it('deixa de fora quem não tem nenhuma Função', () => {
    const semFuncao: Membro = { id: 'novo', nome: 'Novo', funcoes: [], ministro: false, admin: false, inativo: false }
    const todos = secoesDaEquipe([...m.membros, semFuncao], FUNCOES).flatMap((s) => s.membros)
    expect(todos.some((linha) => linha.membro.id === 'novo')).toBe(false)
  })

  it('traz as Funções do Membro na ordem cadastrada', () => {
    const marcos = secao('vocal').membros.find((linha) => linha.membro.nome === 'Marcos')!
    expect(marcos.funcoes.map((f) => f.id)).toEqual(['vocal', 'violao'])
  })
})

describe('funcoesDoMembro', () => {
  it('ignora Função que o Membro não tem', () => {
    const isa = m.membros.find((x) => x.id === 'isa')!
    expect(funcoesDoMembro(isa, FUNCOES).every((f) => isa.funcoes.includes(f.id))).toBe(true)
  })
})

describe('podeSerMinistro', () => {
  it('vale pra quem tem o papel e pro Admin', () => {
    expect(podeSerMinistro(m.membros.find((x) => x.id === 'marcos')!)).toBe(true)
    expect(podeSerMinistro(m.membros.find((x) => x.id === 'gabriel')!)).toBe(true)
    expect(podeSerMinistro(m.membros.find((x) => x.id === 'ana')!)).toBe(false)
  })
})

describe('alternar', () => {
  it('acrescenta a Função de quem não estava na Equipe', () => {
    expect(alternarFuncao(undefined, 'guitarra')).toEqual({ funcoes: ['guitarra'], ministro: false })
  })

  it('tira a Função que já estava', () => {
    const antes = { funcoes: ['vocal', 'violao'], ministro: true }
    expect(alternarFuncao(antes, 'vocal')).toEqual({ funcoes: ['violao'], ministro: true })
  })

  it('não mexe na marca de Ministro ao trocar Função', () => {
    expect(alternarFuncao({ funcoes: [], ministro: true }, 'baixo').ministro).toBe(true)
  })

  it('liga e desliga a marca de Ministro sem mexer nas Funções', () => {
    expect(alternarMinistro({ funcoes: ['vocal'], ministro: false })).toEqual({ funcoes: ['vocal'], ministro: true })
    expect(alternarMinistro({ funcoes: ['vocal'], ministro: true })).toEqual({ funcoes: ['vocal'], ministro: false })
  })

  it('sai da Equipe quando não sobra Função nem a marca de Ministro', () => {
    expect(saiDaEquipe({ funcoes: [], ministro: false })).toBe(true)
    expect(saiDaEquipe({ funcoes: [], ministro: true })).toBe(false)
    expect(saiDaEquipe({ funcoes: ['som'], ministro: false })).toBe(false)
  })
})

describe('comEntrada', () => {
  const equipe = [
    { membroId: 'isa', funcoes: ['vocal'], ministro: true },
    { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
  ]

  it('acrescenta quem ainda não estava, no fim da Equipe', () => {
    const depois = comEntrada(equipe, 'lucas', { funcoes: ['bateria'], ministro: false })
    expect(depois.map((x) => x.membroId)).toEqual(['isa', 'pedro', 'lucas'])
  })

  it('troca o estado de quem já estava sem mudar a ordem', () => {
    const depois = comEntrada(equipe, 'isa', { funcoes: ['vocal', 'teclado'], ministro: true })
    expect(depois.map((x) => x.membroId)).toEqual(['isa', 'pedro'])
    expect(depois[0].funcoes).toEqual(['vocal', 'teclado'])
  })

  it('tira da Equipe quem ficou sem Função e sem a marca', () => {
    const depois = comEntrada(equipe, 'pedro', { funcoes: [], ministro: false })
    expect(depois.map((x) => x.membroId)).toEqual(['isa'])
  })

  it('acha a entrada do Membro e nada pra quem está fora', () => {
    expect(entradaDoMembro(equipe, 'pedro')?.funcoes).toEqual(['baixo'])
    expect(entradaDoMembro(equipe, 'bia')).toBeUndefined()
  })
})

describe('naoRecebeNotificacao', () => {
  const semPush = { ...m.membros[0], push: 0 }
  const comPush = { ...m.membros[0], push: 2 }

  it('avisa o Ministro só sobre quem está escalado e não tem aparelho', () => {
    expect(naoRecebeNotificacao(semPush, true)).toBe(true)
    expect(naoRecebeNotificacao(comPush, true)).toBe(false)
  })

  it('não polui a lista com quem nem está na Equipe', () => {
    expect(naoRecebeNotificacao(semPush, false)).toBe(false)
  })

  it('fica quieto quando a rota não trouxe a contagem', () => {
    expect(naoRecebeNotificacao(m.membros[0], true)).toBe(false)
  })
})
