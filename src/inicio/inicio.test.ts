import { describe, expect, it } from 'vitest'
import type { SugestaoApresentada } from '../api/tipos'
import type { PessoaDaEquipe } from '../dominio'
import { linhaDaEscala, quandoAcontece, selosDaEquipe, textoDeSugestoesNovas, textoDoPosCulto } from './inicio'

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

describe('selosDaEquipe', () => {
  const equipe = [
    pessoa('isa', 'Isa', ['Vocal'], true),
    pessoa('ana', 'Ana', ['Vocal']),
    pessoa('gabriel', 'Gabriel', ['Guitarra']),
  ]

  it('põe você na frente, com as Funções em minúscula', () => {
    expect(selosDaEquipe(equipe, 'gabriel')).toEqual([
      { membroId: 'gabriel', texto: 'você: guitarra', variante: 'destaque' },
      { membroId: 'isa', texto: 'Isa · ministro', variante: 'ministro' },
      { membroId: 'ana', texto: 'Ana vocal', variante: 'neutro' },
    ])
  })

  it('mantém a ordem recebida de quem não é você', () => {
    expect(selosDaEquipe(equipe, 'ninguem').map((selo) => selo.membroId)).toEqual(['isa', 'ana', 'gabriel'])
  })

  it('diz ministro junto das Funções quando quem olha dirige a Escala', () => {
    expect(selosDaEquipe(equipe, 'isa')[0]).toEqual({
      membroId: 'isa',
      texto: 'você: ministro, vocal',
      variante: 'destaque',
    })
  })

  it('aceita pessoa sem Função', () => {
    const sozinha = [pessoa('davi', 'Davi', [])]

    expect(selosDaEquipe(sozinha, 'ninguem')[0].texto).toBe('Davi')
    expect(selosDaEquipe(sozinha, 'davi')[0].texto).toBe('você')
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
