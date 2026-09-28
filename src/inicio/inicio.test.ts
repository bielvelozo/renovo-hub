import { describe, expect, it } from 'vitest'
import type { SugestaoApresentada } from '../api/tipos'
import type { Pendencia, PessoaDaEquipe } from '../dominio'
import {
  destinoDaPendencia,
  linhaDaEscala,
  ministraAEscala,
  pendenciasVemAntes,
  quandoAcontece,
  resumoDaProximaEscala,
  resumoDasPendencias,
  textoDeSugestoesNovas,
  textoDoPosCulto,
  tituloDasPendencias,
  tituloDoInicio,
} from './inicio'

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

    expect(textoDoPosCulto(posCulto, HOJE)).toBe('Hoje: 5 músicas no histórico')
    expect(textoDoPosCulto(posCulto, '2026-09-14')).toBe('Ontem: 5 músicas no histórico')
  })

  it('concorda o singular', () => {
    expect(textoDoPosCulto({ escalaId: 'e1', titulo: 'Culto', data: HOJE, itens: 1 }, HOJE)).toBe(
      'Hoje: 1 música no histórico',
    )
  })
})

describe('tituloDoInicio', () => {
  it('é a data da próxima Escala com inicial maiúscula, pra servir de h1', () => {
    expect(tituloDoInicio('2026-09-16', HOJE)).toBe('Qua, 16 de set')
    expect(tituloDoInicio('2027-01-03', HOJE)).toBe('Dom, 3 de jan de 2027')
  })
})

describe('pendências no Início', () => {
  const pendencias: Pendencia[] = [
    { chave: 'falta-funcao', texto: 'falta 1 bateria', funcaoId: 'bateria' },
    { chave: 'sem-musicas', texto: 'sem músicas' },
    { chave: 'falta-funcao', texto: 'faltam 2 vocais', funcaoId: 'vocal' },
    { chave: 'sem-ministro', texto: 'sem ministro' },
  ]

  it('resume em duas, com sem ministro na frente e o resto contado', () => {
    expect(resumoDasPendencias(pendencias)).toBe('sem ministro · falta 1 bateria · mais 2')
    expect(resumoDasPendencias(pendencias.slice(0, 2))).toBe('falta 1 bateria · sem músicas')
  })

  it('leva à Equipe com a Função em foco, ou a adicionar música quando só falta o Repertório', () => {
    expect(destinoDaPendencia('e1', pendencias)).toBe('/escalas/e1/equipe')
    expect(destinoDaPendencia('e1', [pendencias[0]])).toBe('/escalas/e1/equipe?funcao=bateria')
    expect(destinoDaPendencia('e1', [pendencias[1]])).toBe('/escalas/e1/adicionar')
    expect(destinoDaPendencia('e1', [])).toBe('/escalas/e1')
  })
})

describe('pendenciasVemAntes', () => {
  it('põe as pendências antes do Repertório quando alguma Escala pendente vem antes da mostrada', () => {
    expect(pendenciasVemAntes([{ data: '2026-09-27' }], '2026-10-04', true)).toBe(true)
    expect(pendenciasVemAntes([{ data: '2026-10-04' }, { data: '2026-10-11' }], '2026-10-04', true)).toBe(false)
    expect(pendenciasVemAntes([], '2026-10-04', true)).toBe(false)
  })

  it('para quem dirige sem ser o Ministro da Escala mostrada, as pendências vêm antes do Repertório dos outros', () => {
    expect(pendenciasVemAntes([{ data: '2026-10-11' }], '2026-10-04', false)).toBe(true)
    expect(pendenciasVemAntes([], '2026-10-04', false)).toBe(false)
  })
})

describe('tituloDasPendencias', () => {
  it('diz até que dia a lista olha, em vez do número de semanas da regra', () => {
    expect(tituloDasPendencias('2026-09-25')).toBe('Precisa de atenção · até 23 out')
  })
})

describe('resumoDaProximaEscala', () => {
  const equipe = [
    pessoa('isa', 'Isa', ['Vocal'], true),
    pessoa('ana', 'Ana', ['Vocal']),
    pessoa('gabriel', 'Gabriel', ['Guitarra']),
  ]

  it('diz a Função de quem olha, quem ministra e os rostos na ordem recebida', () => {
    expect(resumoDaProximaEscala(equipe, 'gabriel')).toEqual({
      suaFuncao: 'Guitarra',
      ministros: 'Isa',
      rostos: [
        { membroId: 'isa', nome: 'Isa', foto: null },
        { membroId: 'ana', nome: 'Ana', foto: null },
        { membroId: 'gabriel', nome: 'Gabriel', foto: null },
      ],
      total: 3,
      extras: 0,
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

  it('sabe se quem olha é Ministro da Escala', () => {
    expect(ministraAEscala(equipe, 'isa')).toBe(true)
    expect(ministraAEscala(equipe, 'gabriel')).toBe(false)
    expect(ministraAEscala(equipe, 'ninguem')).toBe(false)
  })

  it('aceita pessoa sem Função e Equipe sem Ministro', () => {
    const sozinha = [pessoa('davi', 'Davi', [])]

    expect(resumoDaProximaEscala(sozinha, 'davi')).toEqual({
      suaFuncao: 'Escalado',
      ministros: null,
      rostos: [{ membroId: 'davi', nome: 'Davi', foto: null }],
      total: 1,
      extras: 0,
    })
  })

  it('mostra até seis rostos; acima disso, cinco e a conta do que sobrou', () => {
    const equipeDe = (quantas: number) => Array.from({ length: quantas }, (_, n) => pessoa('m' + n, 'Membro ' + n, ['Vocal']))

    const seis = resumoDaProximaEscala(equipeDe(6), 'ninguem')
    expect(seis.rostos).toHaveLength(6)
    expect(seis.extras).toBe(0)

    const nove = resumoDaProximaEscala(equipeDe(9), 'ninguem')
    expect(nove.rostos).toHaveLength(5)
    expect(nove.extras).toBe(4)
    expect(nove.total).toBe(9)
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
