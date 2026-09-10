import { describe, expect, it } from 'vitest'
import { ministerioDeExemplo } from './exemplo'
import {
  daFormacao,
  membroPorId,
  unicoDoSom,
  ehMusical,
  escalaPorId,
  estadoEscala,
  gruposEquipe,
  membrosMusicais,
  ministradoPorDe,
  ministros,
  naipeDe,
  rotuloDoHorario,
  tituloEscala,
} from './escala'
import type { Escala } from './tipos'

const m = ministerioDeExemplo()
const emEscala = (id: string) => escalaPorId(m, id)

describe('estadoEscala', () => {
  it('mantém a Escala do dia como Agendada: só vira Realizada depois da meia-noite de Brasília', () => {
    const escala = { ...emEscala('e0913'), data: '2026-09-08' }

    expect(estadoEscala(escala, '2026-09-08')).toBe('agendada')
    expect(estadoEscala(escala, '2026-09-09')).toBe('realizada')
  })

  it('nasce Realizada quando a Escala é criada com data passada', () => {
    expect(estadoEscala(emEscala('e0816'), m.hoje)).toBe('realizada')
  })

  it('trata Cancelada como estado próprio, antes ou depois da data', () => {
    const cancelada: Escala = { ...emEscala('e0816'), cancelada: true }

    expect(estadoEscala(cancelada, m.hoje)).toBe('cancelada')
    expect(estadoEscala({ ...cancelada, data: '2026-12-25' }, m.hoje)).toBe('cancelada')
  })
})

describe('tituloEscala', () => {
  it('usa o rótulo e o horário abreviado', () => {
    expect(tituloEscala(emEscala('e0913'))).toBe('Culto de Domingo 18h')
  })

  it('chama de Santa Ceia a Escala marcada, no lugar do rótulo', () => {
    expect(tituloEscala(emEscala('e0906'))).toBe('Santa Ceia 08h')
  })

  it('mantém os minutos quando o horário não é redondo', () => {
    expect(rotuloDoHorario('19:30')).toBe('19:30')
    expect(rotuloDoHorario('19:00')).toBe('19h')
  })
})

describe('naipes e Funções', () => {
  it('trata Vocal e Músicos como Função musical e Som como técnica', () => {
    expect(naipeDe(m, 'guitarra')).toBe('instrumentos')
    expect(ehMusical(m, 'vocal')).toBe(true)
    expect(ehMusical(m, 'guitarra')).toBe(true)
    expect(ehMusical(m, 'som')).toBe(false)
  })
})

describe('Ministro como marca', () => {
  it('lista os Ministros marcados na Equipe', () => {
    expect(ministros(emEscala('e0830'))).toEqual(['isa'])
  })

  it('preenche o ministrado por sozinho quando há um só Ministro', () => {
    const escala = emEscala('e0830')

    expect(ministradoPorDe(escala, escala.itens[0])).toBe('isa')
  })

  it('deixa o ministrado por em aberto quando há mais de um Ministro dividindo', () => {
    const escala = emEscala('e0830')
    const doisMinistros: Escala = {
      ...escala,
      equipe: escala.equipe.map((x) => (x.membroId === 'marcos' ? { ...x, ministro: true } : x)),
    }

    expect(ministradoPorDe(doisMinistros, doisMinistros.itens[0])).toBeNull()
  })

  it('respeita o ministrado por explícito do Item', () => {
    const escala = emEscala('e0830')
    const item = { ...escala.itens[0], ministradoPor: 'marcos' }

    expect(ministradoPorDe(escala, item)).toBe('marcos')
  })
})

describe('membrosMusicais', () => {
  it('deixa de fora quem só tem Função técnica', () => {
    const musicais = membrosMusicais(m, emEscala('e0816'))

    expect(musicais).toContain('marcos')
    expect(musicais).not.toContain('davi')
  })

  it('inclui quem tem uma Função musical e uma técnica na mesma Escala', () => {
    const escala = emEscala('e0816')
    const comSom: Escala = {
      ...escala,
      equipe: escala.equipe.map((x) => (x.membroId === 'pedro' ? { ...x, funcoes: ['baixo', 'som'] } : x)),
    }

    expect(membrosMusicais(m, comSom)).toContain('pedro')
  })
})

describe('gruposEquipe', () => {
  it('agrupa em Ministro, Vocal, Músicos e Som, com o Ministro fora dos outros grupos', () => {
    expect(gruposEquipe(m, emEscala('e0816'))).toEqual([
      { nome: 'Ministro', itens: ['Marcos (violão)'] },
      { nome: 'Vocal', itens: ['Ana'] },
      { nome: 'Músicos', itens: ['Gabriel (guitarra)', 'Pedro (baixo)', 'Lucas (bateria)'] },
      { nome: 'Som', itens: ['Davi'] },
    ])
  })

  it('escreve Ministros no plural quando há mais de um', () => {
    const escala = emEscala('e0816')
    const doisMinistros: Escala = {
      ...escala,
      equipe: escala.equipe.map((x) => (x.membroId === 'ana' ? { ...x, ministro: true } : x)),
    }

    expect(gruposEquipe(m, doisMinistros)[0]).toEqual({ nome: 'Ministros', itens: ['Marcos (violão)', 'Ana'] })
  })

  it('lista o vocal pelos nomes e omite grupo vazio', () => {
    const grupos = gruposEquipe(m, emEscala('e0823'))

    expect(grupos.find((g) => g.nome === 'Vocal')?.itens).toEqual(['Júlia', 'Bia'])
    expect(gruposEquipe(m, emEscala('e0920'))).toEqual([])
  })
})

describe('daFormacao', () => {
  it('guarda só as Funções de instrumento da Equipe', () => {
    const escala = escalaPorId(m, 'e0830')

    expect(daFormacao(m, escala.equipe)).toEqual([
      { membroId: 'gabriel', funcoes: ['guitarra'] },
      { membroId: 'marcos', funcoes: ['violao'] },
      { membroId: 'lucas', funcoes: ['bateria'] },
    ])
  })

  it('tira quem só tem vocal ou técnica, e a marca de Ministro', () => {
    expect(daFormacao(m, [{ membroId: 'isa', funcoes: ['vocal'], ministro: true }])).toEqual([])
    expect(daFormacao(m, [{ membroId: 'davi', funcoes: ['som'], ministro: false }])).toEqual([])
  })
})

describe('unicoDoSom', () => {
  it('acha o Membro quando ele é o único com Função de som', () => {
    expect(unicoDoSom(m)).toEqual({ membroId: 'davi', funcoes: ['som'], ministro: false })
  })

  it('devolve nulo quando há mais de um', () => {
    const dois = { ...m, membros: [...m.membros, { ...membroPorId(m, 'davi'), id: 'outro', nome: 'Outro' }] }

    expect(unicoDoSom(dois)).toBeNull()
  })

  it('não conta quem está inativo', () => {
    const inativo = {
      ...m,
      membros: m.membros.map((membro) => (membro.id === 'davi' ? { ...membro, inativo: true } : membro)),
    }

    expect(unicoDoSom(inativo)).toBeNull()
  })
})
