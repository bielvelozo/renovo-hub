import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { horaEmBrasilia } from './datas'
import {
  avisoDeCancelada,
  avisoDeEscalado,
  avisoDeLembrete,
  avisoDeMudanca,
  avisoDeRemarcada,
  avisoDeSugestaoAceita,
  avisoDeSugestaoGuardada,
  avisoDeSugestaoRecusada,
  avisoDeVariasMudancas,
  caminhoDaEscala,
  dataDoLembrete,
  descricaoDaMudanca,
} from './notificacoes'

beforeAll(() => vi.useFakeTimers({ now: new Date('2026-09-10T15:00:00Z'), toFake: ['Date'] }))
afterAll(() => vi.useRealTimers())
import type { Escala, Item, Ministerio } from './tipos'

const escala: Escala = {
  id: 'e0913',
  data: '2026-09-13',
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [
    { membroId: 'gabriel', funcoes: ['baixo'], ministro: false },
    { membroId: 'julia', funcoes: ['guitarra', 'vocal'], ministro: false },
    { membroId: 'davi', funcoes: [], ministro: true },
  ],
  itens: [],
}

const m: Ministerio = {
  hoje: '2026-09-05',
  membros: [
    { id: 'gabriel', nome: 'Gabriel', funcoes: ['baixo'], ministro: false, admin: true, inativo: false },
    { id: 'julia', nome: 'Júlia', funcoes: ['guitarra', 'vocal'], ministro: false, admin: false, inativo: false },
    { id: 'davi', nome: 'Davi', funcoes: [], ministro: true, admin: false, inativo: false },
  ],
  funcoes: [
    { id: 'baixo', nome: 'Baixo', grupo: 'instrumentos', ordem: 1 },
    { id: 'guitarra', nome: 'Guitarra', grupo: 'instrumentos', ordem: 2 },
    { id: 'vocal', nome: 'Vocal', grupo: 'vocal', ordem: 3 },
  ],
  musicas: [],
  escalas: [escala],
}

describe('avisoDeEscalado', () => {
  it('diz a Escala, o horário e a Função como o catálogo do spec', () => {
    expect(avisoDeEscalado(m, escala, 'gabriel')).toEqual({
      titulo: 'Você foi escalado',
      corpo: 'Você está na Escala de dom, 13 de set, 18h, no baixo',
      url: '/escalas/e0913',
    })
  })

  it('junta as Funções com a preposição de cada uma', () => {
    expect(avisoDeEscalado(m, escala, 'julia').corpo).toBe(
      'Você está na Escala de dom, 13 de set, 18h, na guitarra e no vocal',
    )
  })

  it('omite a Função de quem entrou só como Ministro', () => {
    expect(avisoDeEscalado(m, escala, 'davi').corpo).toBe('Você está na Escala de dom, 13 de set, 18h')
  })
})

describe('avisoDeMudanca', () => {
  it('descreve uma mudança só como o catálogo do spec', () => {
    expect(avisoDeMudanca(escala, 'entrou', 'Meia Noite (Tom G)')).toEqual({
      titulo: 'Música na sua Escala',
      corpo: 'Meia Noite (Tom G) entrou na Escala de dom, 13 de set',
      url: '/escalas/e0913',
    })
  })

  it('usa «saiu da» pra remoção e «mudou na» pra edição', () => {
    expect(avisoDeMudanca(escala, 'saiu', 'Meia Noite').corpo).toBe('Meia Noite saiu da Escala de dom, 13 de set')
    expect(avisoDeMudanca(escala, 'mudou', 'Meia Noite (Tom A)').corpo).toBe(
      'Meia Noite (Tom A) mudou na Escala de dom, 13 de set',
    )
  })

  it('agrupa várias mudanças numa contagem', () => {
    expect(avisoDeVariasMudancas(escala, 3).corpo).toBe('3 mudanças na Escala de dom, 13 de set')
    expect(avisoDeVariasMudancas(escala, 2).corpo).toBe('2 mudanças na Escala de dom, 13 de set')
  })
})

describe('avisoDeLembrete', () => {
  it('conta as músicas', () => {
    expect(avisoDeLembrete(escala, 4)).toEqual({
      titulo: 'Amanhã tem Escala',
      corpo: 'Amanhã 18h: Escala com 4 músicas. Toque pra ver os Tons.',
      url: '/escalas/e0913',
    })
  })

  it('fala no singular com uma música e avisa quando não tem nenhuma', () => {
    expect(avisoDeLembrete(escala, 1).corpo).toBe('Amanhã 18h: Escala com 1 música. Toque pra ver os Tons.')
    expect(avisoDeLembrete(escala, 0).corpo).toBe('Amanhã 18h: Escala ainda sem músicas. Toque pra ver a Equipe.')
  })
})

describe('avisoDeCancelada e avisoDeRemarcada', () => {
  it('nomeia a Escala pelo rótulo', () => {
    expect(avisoDeCancelada(escala)).toEqual({
      titulo: 'Escala cancelada',
      corpo: 'Culto de Domingo de dom, 13 de set cancelado',
      url: '/escalas/e0913',
    })
  })

  it('chama a Santa Ceia pelo nome dela', () => {
    expect(avisoDeCancelada({ ...escala, santaCeia: true }).corpo).toBe('Santa Ceia de dom, 13 de set cancelado')
  })

  it('mostra a data nova quando remarca', () => {
    const depois = { ...escala, data: '2026-09-20', horario: '08:00' }
    expect(avisoDeRemarcada(depois)).toEqual({
      titulo: 'Escala remarcada',
      corpo: 'Culto de Domingo mudou para dom, 20 de set, 08h',
      url: '/escalas/e0913',
    })
  })
})

describe('caminhoDaEscala', () => {
  it('aponta pra tela da Escala', () => {
    expect(caminhoDaEscala('e0913')).toBe('/escalas/e0913')
  })
})

describe('horaEmBrasilia', () => {
  it('devolve a hora cheia no fuso de Brasília', () => {
    expect(horaEmBrasilia(new Date('2026-09-12T13:00:00Z'))).toBe(10)
    expect(horaEmBrasilia(new Date('2026-09-12T12:59:59Z'))).toBe(9)
    expect(horaEmBrasilia(new Date('2026-09-12T03:00:00Z'))).toBe(0)
  })
})

describe('dataDoLembrete', () => {
  it('só devolve o dia seguinte a partir das 10h de Brasília', () => {
    expect(dataDoLembrete(new Date('2026-09-12T13:00:00Z'))).toBe('2026-09-13')
    expect(dataDoLembrete(new Date('2026-09-12T23:00:00Z'))).toBe('2026-09-13')
  })

  it('não devolve nada antes das 10h', () => {
    expect(dataDoLembrete(new Date('2026-09-12T12:59:00Z'))).toBeNull()
    expect(dataDoLembrete(new Date('2026-09-12T03:00:00Z'))).toBeNull()
  })

  it('vira o alvo junto com o dia de Brasília', () => {
    expect(dataDoLembrete(new Date('2026-09-13T13:00:00Z'))).toBe('2026-09-14')
  })
})

describe('descricaoDaMudanca', () => {
  const comMusicas: Ministerio = {
    ...m,
    musicas: [
      { id: 'm1', titulo: 'Meia Noite', artista: 'Renovo', videoId: 'a', legado: false, tomConhecido: null, tomOriginal: null, arquivada: false, revisar: false },
      { id: 'm2', titulo: 'Sublime', artista: 'Renovo', videoId: 'b', legado: false, tomConhecido: null, tomOriginal: null, arquivada: false, revisar: false },
    ],
  }

  it('põe o Tom junto do título como o catálogo do spec', () => {
    const item: Item = { id: 'i1', tipo: 'inteira', musicaId: 'm1', tom: 'G', observacao: '', ministradoPor: null }
    expect(descricaoDaMudanca(comMusicas, item)).toBe('Meia Noite (Tom G)')
  })

  it('lista as músicas do Medley, que não tem Tom próprio', () => {
    const item: Item = {
      id: 'i2',
      tipo: 'medley',
      observacao: '',
      ministradoPor: null,
      trechos: [
        { musicaId: 'm1', tom: 'D', inicio: '0:10', fim: '1:00' },
        { musicaId: 'm2', tom: 'F', inicio: '0:20', fim: '1:10' },
      ],
    }
    expect(descricaoDaMudanca(comMusicas, item)).toBe('Medley: Meia Noite + Sublime')
  })
})

describe('avisos de Sugestão', () => {
  it('aceita diz a música e o dia, e leva pra Escala', () => {
    expect(avisoDeSugestaoAceita(escala, 'Bondade de Deus')).toEqual({
      titulo: 'Sua sugestão entrou',
      corpo: 'Bondade de Deus no dia dom, 13 de set',
      url: '/escalas/e0913',
    })
  })

  it('guardada e recusada levam pra Sugestões, e a recusada carrega o motivo quando há', () => {
    expect(avisoDeSugestaoGuardada('Bondade de Deus')).toEqual({
      titulo: 'Sua sugestão foi guardada pra depois',
      corpo: 'Bondade de Deus',
      url: '/sugestoes',
    })
    expect(avisoDeSugestaoRecusada('Bondade de Deus', '')).toMatchObject({
      titulo: 'Sua sugestão não entrou desta vez',
      corpo: 'Bondade de Deus',
    })
    expect(avisoDeSugestaoRecusada('Bondade de Deus', 'já tocamos muito').corpo).toBe('Bondade de Deus · já tocamos muito')
  })
})
