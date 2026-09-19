import { describe, expect, it } from 'vitest'
import type { EscalaResumida } from '../api/tipos'
import {
  deslocarMes,
  dicaDaEscala,
  domingosQueFaltam,
  linhasDoMes,
  mesDaData,
  passadasEProximas,
  resumoDoMes,
  nomeDoMes,
  rotuloDoMes,
  selosDaEscala,
  textoDeCriarDomingos,
} from './mes'

describe('mes', () => {
  it('tira o mês da data', () => {
    expect(mesDaData('2026-09-13')).toBe('2026-09')
  })

  it('anda pra frente e pra trás dentro do ano', () => {
    expect(deslocarMes('2026-09', 1)).toBe('2026-10')
    expect(deslocarMes('2026-09', -1)).toBe('2026-08')
  })

  it('vira o ano nos dois sentidos', () => {
    expect(deslocarMes('2026-12', 1)).toBe('2027-01')
    expect(deslocarMes('2026-01', -1)).toBe('2025-12')
  })

  it('anda vários meses de uma vez', () => {
    expect(deslocarMes('2026-01', 13)).toBe('2027-02')
  })

  it('escreve o mês por extenso com o ano', () => {
    expect(rotuloDoMes('2026-09')).toBe('Setembro 2026')
    expect(nomeDoMes('2026-03')).toBe('Março')
  })

  it('lista os domingos do mês que ainda não têm Escala', () => {
    expect(domingosQueFaltam('2026-09', ['2026-09-13'])).toEqual(['2026-09-06', '2026-09-20', '2026-09-27'])
  })

  it('não conta datas de outros meses como já criadas', () => {
    expect(domingosQueFaltam('2026-09', ['2026-08-30'])).toHaveLength(4)
  })

  it('devolve lista vazia quando o mês inteiro já existe', () => {
    const todos = ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27']
    expect(domingosQueFaltam('2026-09', todos)).toEqual([])
  })

})

describe('linha do Mês', () => {
  it('junta horário, ministros e quantidade de músicas', () => {
    expect(dicaDaEscala(umaEscala({ horario: '18:00', ministros: ['Isa'], quantidadeDeItens: 5 }))).toBe(
      '18h · Isa · 5 músicas',
    )
  })

  it('diz "sem músicas" quando o Repertório está vazio e junta os Ministros por vírgula', () => {
    expect(dicaDaEscala(umaEscala({ horario: '08:30', ministros: ['Isa', 'Marcos'], quantidadeDeItens: 0 }))).toBe(
      '08:30 · Isa, Marcos · sem músicas',
    )
  })

  it('omite os Ministros quando não há nenhum e usa o singular de música', () => {
    expect(dicaDaEscala(umaEscala({ ministros: [], quantidadeDeItens: 1 }))).toBe('19h · 1 música')
  })
})

describe('selos do Mês', () => {
  it('mostra Santa Ceia, as suas Funções e o que falta para quem dirige', () => {
    const escala = umaEscala({
      santaCeia: true,
      minhasFuncoes: ['Guitarra'],
      pendencias: [{ chave: 'sem-musicas', texto: 'sem músicas' }],
      pronta: false,
    })

    expect(selosDaEscala(escala, true)).toEqual([
      { chave: 'ceia', texto: 'santa ceia', variante: 'ceia' },
      { chave: 'voce', texto: 'você · guitarra', variante: 'destaque' },
      { chave: 'sem-musicas', texto: 'sem músicas', variante: 'atencao' },
    ])
  })

  it('mostra "pronta" só para quem dirige', () => {
    const escala = umaEscala({ pronta: true })

    expect(selosDaEscala(escala, true)).toEqual([{ chave: 'pronta', texto: 'pronta', variante: 'sucesso' }])
    expect(selosDaEscala(escala, false)).toEqual([])
  })

  it('mostra "cancelada" e nada de pendência para todo mundo', () => {
    const escala = umaEscala({ estado: 'cancelada', cancelada: true, pronta: true })

    expect(selosDaEscala(escala, true)).toEqual([{ chave: 'cancelada', texto: 'cancelada', variante: 'cancelada' }])
  })

  it('não cobra pendência de Escala realizada', () => {
    expect(selosDaEscala(umaEscala({ estado: 'realizada', pronta: true }), true)).toEqual([])
  })

  it('junta várias Funções suas na mesma linha', () => {
    expect(selosDaEscala(umaEscala({ minhasFuncoes: ['Vocal', 'Teclado'] }), false)).toEqual([
      { chave: 'voce', texto: 'você · vocal, teclado', variante: 'destaque' },
    ])
  })
})

describe('passadas e próximas', () => {
  const escalas = [
    umaEscala({ id: 'e1', data: '2026-09-06' }),
    umaEscala({ id: 'e2', data: '2026-09-13' }),
    umaEscala({ id: 'e3', data: '2026-09-20' }),
  ]

  it('separa o que já passou do que vem de hoje em diante', () => {
    const { passadas, proximas } = passadasEProximas(linhasDoMes(escalas, '2026-09', '2026-09-13'), '2026-09-13')

    expect(passadas.map((linha) => linha.tipo === 'escala' && linha.escala.id)).toEqual(['e1'])
    expect(proximas.map((linha) => linha.tipo === 'escala' && linha.escala.id)).toEqual(['e2', 'e3'])
  })

  it('deixa o "nada hoje" abrindo as próximas', () => {
    const { passadas, proximas } = passadasEProximas(linhasDoMes(escalas, '2026-09', '2026-09-15'), '2026-09-15')

    expect(passadas).toHaveLength(2)
    expect(proximas[0]).toEqual({ tipo: 'nada', data: '2026-09-15' })
  })

  it('não recolhe nada num mês que ainda não começou', () => {
    const { passadas, proximas } = passadasEProximas(linhasDoMes(escalas, '2026-09', '2026-08-30'), '2026-08-30')

    expect(passadas).toHaveLength(0)
    expect(proximas).toHaveLength(3)
  })

  it('não recolhe um mês que já passou inteiro: não sobraria nada pra ver', () => {
    const { passadas, proximas } = passadasEProximas(linhasDoMes(escalas, '2026-09', '2026-10-02'), '2026-10-02')

    expect(passadas).toHaveLength(0)
    expect(proximas).toHaveLength(3)
  })
})

describe('resumo do Mês', () => {
  it('conta as Escalas e em quantas a pessoa está', () => {
    const escalas = [
      umaEscala({ id: 'e1', minhasFuncoes: ['Guitarra'] }),
      umaEscala({ id: 'e2' }),
      umaEscala({ id: 'e3', minhasFuncoes: ['Vocal'] }),
    ]

    expect(resumoDoMes(escalas)).toBe('3 escalas no mês · você está em 2')
  })

  it('concorda o singular e diz quando a pessoa não está em nenhuma', () => {
    expect(resumoDoMes([umaEscala({ id: 'e1' })])).toBe('1 escala no mês · você não está em nenhuma')
  })
})

describe('linhas do Mês', () => {
  it('ordena por data e marca a Escala de hoje', () => {
    const linhas = linhasDoMes(
      [umaEscala({ id: 'e2', data: '2026-09-20' }), umaEscala({ id: 'e1', data: '2026-09-13' })],
      '2026-09',
      '2026-09-13',
    )

    expect(linhas.map((linha) => (linha.tipo === 'escala' ? linha.escala.id : linha.data))).toEqual(['e1', 'e2'])
    expect(linhas.map((linha) => linha.tipo === 'escala' && linha.hoje)).toEqual([true, false])
  })

  it('insere "nada hoje" na posição do dia quando não há Escala hoje', () => {
    const linhas = linhasDoMes(
      [umaEscala({ id: 'e1', data: '2026-09-06' }), umaEscala({ id: 'e2', data: '2026-09-20' })],
      '2026-09',
      '2026-09-10',
    )

    expect(linhas.map((linha) => (linha.tipo === 'escala' ? linha.escala.id : linha.data))).toEqual([
      'e1',
      '2026-09-10',
      'e2',
    ])
  })

  it('não fala de hoje em outro mês', () => {
    const linhas = linhasDoMes([umaEscala({ id: 'e1', data: '2026-10-04' })], '2026-10', '2026-09-10')

    expect(linhas).toHaveLength(1)
  })

  it('mostra só "nada hoje" no mês corrente vazio', () => {
    expect(linhasDoMes([], '2026-09', '2026-09-10')).toEqual([{ tipo: 'nada', data: '2026-09-10' }])
  })
})

describe('texto de criar domingos', () => {
  it('diz o mês quando a tela está vazia', () => {
    expect(textoDeCriarDomingos(4, true)).toBe('Criar os 4 domingos')
    expect(textoDeCriarDomingos(1, true)).toBe('Criar o domingo')
  })

  it('diz o que falta quando já há Escalas', () => {
    expect(textoDeCriarDomingos(2, false)).toBe('Criar os 2 domingos que faltam')
    expect(textoDeCriarDomingos(1, false)).toBe('Criar o domingo que falta')
  })
})

function umaEscala(parcial: Partial<EscalaResumida> = {}): EscalaResumida {
  return {
    id: 'e1',
    data: '2026-09-13',
    horario: '19:00',
    rotulo: 'Culto de Domingo',
    santaCeia: false,
    cancelada: false,
    estado: 'agendada',
    titulo: 'Culto de Domingo 19h',
    ministros: ['Isa'],
    membros: [],
    quantidadeNaEquipe: 4,
    quantidadeDeItens: 3,
    pendencias: [],
    pronta: false,
    porGrupo: [],
    minhasFuncoes: [],
    ...parcial,
  }
}
