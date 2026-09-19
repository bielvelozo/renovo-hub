import { describe, expect, it } from 'vitest'
import type { SugestaoApresentada } from '../api/tipos'
import type { PessoaDaEquipe } from '../dominio'
import { linhaDaEscala, quandoAcontece, resumoDaProximaEscala, textoDeSugestoesNovas, textoDoPosCulto } from './inicio'

const HOJE = '2026-09-13'

const pessoa = (membroId: string, nome: string, funcoes: string[], ministro = false): PessoaDaEquipe => ({
  membroId,
  nome,
  funcoes,
  ministro,
})

const sugestao = (id: string, nome: string, data: string, extra: Partial<SugestaoApresentada> = {}) =>
  ({
    id,
    membro: { id: nome.toLowerCase(), nome },
    musica: null,
    link: null,
    titulo: 'Uma música',
    observacao: '',
    data,
    promovidaEm: null,
    estado: 'aberta',
    motivo: '',
    decididaEm: null,
    decididaPor: null,
    escala: null,
    apoios: [],
    apoiei: false,
    ...extra,
  }) as SugestaoApresentada

describe('quandoAcontece', () => {
  it('diz hoje, amanhã e o número de dias', () => {
    expect(quandoAcontece('2026-09-13', HOJE)).toBe('hoje')
    expect(quandoAcontece('2026-09-14', HOJE)).toBe('amanhã')
    expect(quandoAcontece('2026-09-16', HOJE)).toBe('em 3 dias')
  })

  it('trata data passada como hoje, pra Escala do dia que ainda não virou', () => {
    expect(quandoAcontece('2026-09-12', HOJE)).toBe('hoje')
  })
})

describe('linhaDaEscala', () => {
  it('junta dia, horário e distância', () => {
    expect(linhaDaEscala({ data: '2026-09-16', horario: '18:00' }, HOJE)).toBe('qua, 16 de set · 18h · em 3 dias')
  })
})

describe('textoDoPosCulto', () => {
  it('diz Hoje no dia da Escala e Ontem no dia seguinte', () => {
    const posCulto = { escalaId: 'e1', titulo: 'Culto de Domingo 18h', data: HOJE, itens: 5 }

    expect(textoDoPosCulto(posCulto, HOJE)).toBe('Hoje: 5 músicas registradas')
    expect(textoDoPosCulto(posCulto, '2026-09-14')).toBe('Ontem: 5 músicas registradas')
  })

  it('concorda o singular', () => {
    expect(textoDoPosCulto({ escalaId: 'e1', titulo: 'Culto', data: HOJE, itens: 1 }, HOJE)).toBe(
      'Hoje: 1 música registrada',
    )
  })
})

describe('resumoDaProximaEscala', () => {
  const equipe = [
    pessoa('isa', 'Isa', ['Vocal'], true),
    pessoa('ana', 'Ana', ['Vocal']),
    pessoa('gabriel', 'Gabriel', ['Guitarra']),
  ]

  it('diz a Função de quem olha, quem ministra e as iniciais na ordem recebida', () => {
    expect(resumoDaProximaEscala(equipe, 'gabriel')).toEqual({
      suaFuncao: 'Guitarra',
      ministros: 'Isa',
      iniciais: ['I', 'A', 'G'],
      total: 3,
    })
  })

  it('não diz Função pra quem não está na Equipe', () => {
    expect(resumoDaProximaEscala(equipe, 'ninguem').suaFuncao).toBeNull()
  })

  it('diz ministro junto das Funções quando quem olha dirige a Escala', () => {
    expect(resumoDaProximaEscala(equipe, 'isa').suaFuncao).toBe('Ministro, vocal')
  })

  it('junta os Ministros que dividem a Escala', () => {
    const dividida = [...equipe, pessoa('marcos', 'Marcos', ['Vocal'], true)]

    expect(resumoDaProximaEscala(dividida, 'gabriel').ministros).toBe('Isa e Marcos')
  })

  it('aceita pessoa sem Função e Equipe sem Ministro', () => {
    const sozinha = [pessoa('davi', 'Davi', [])]

    expect(resumoDaProximaEscala(sozinha, 'davi')).toEqual({ suaFuncao: 'Escalado', ministros: null, iniciais: ['D'], total: 1 })
  })

  it('corta as iniciais em seis sem perder a contagem', () => {
    const grande = Array.from({ length: 9 }, (_, n) => pessoa('m' + n, 'Membro ' + n, ['Vocal']))

    const resumo = resumoDaProximaEscala(grande, 'ninguem')

    expect(resumo.iniciais).toHaveLength(6)
    expect(resumo.total).toBe(9)
  })
})

describe('textoDeSugestoesNovas', () => {
  const lista = [sugestao('s1', 'Júlia', '2026-09-12T10:00:00.000Z'), sugestao('s2', 'Pedro', '2026-09-12T11:00:00.000Z')]

  it('conta as abertas depois da última visita e nomeia quem sugeriu', () => {
    expect(textoDeSugestoesNovas(lista, '2026-09-11T00:00:00.000Z')).toBe('2 sugestões novas · Júlia e Pedro')
  })

  it('some quando nada é novo', () => {
    expect(textoDeSugestoesNovas(lista, '2026-09-13T00:00:00.000Z')).toBeNull()
    expect(textoDeSugestoesNovas([], null)).toBeNull()
  })

  it('ignora as que já foram decididas', () => {
    expect(textoDeSugestoesNovas([sugestao('s3', 'Ana', '2026-09-12T10:00:00.000Z', { estado: 'aceita' })], null)).toBeNull()
  })

  it('não repete quem sugeriu duas vezes e resume a partir de três nomes', () => {
    expect(textoDeSugestoesNovas([lista[0], sugestao('s3', 'Júlia', '2026-09-12T12:00:00.000Z')], null)).toBe(
      '2 sugestões novas · Júlia',
    )

    const tres = [...lista, sugestao('s4', 'Ana', '2026-09-12T12:00:00.000Z'), sugestao('s5', 'Bia', '2026-09-12T13:00:00.000Z')]
    expect(textoDeSugestoesNovas(tres, null)).toBe('4 sugestões novas · Júlia, Pedro e mais 2')
  })
})
