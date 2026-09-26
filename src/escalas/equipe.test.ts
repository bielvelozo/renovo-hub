import { describe, expect, it } from 'vitest'
import { FUNCOES, ministerioDeExemplo } from '../dominio'
import type { Membro } from '../dominio'
import {
  equipePorGrupo,
  linhaDaEquipe,
  musicosDaFormacao,
  alternarFuncao,
  alternarMinistro,
  comEntrada,
  entradaDoMembro,
  funcoesDoMembro,
  memoriaDoMembro,
  mensagemDaFuncao,
  mensagemDoMinistro,
  naoRecebeNotificacao,
  ordenarPorEscalados,
  podeSerMinistro,
  resumoDaEquipe,
  saiDaEquipe,
  secoesDaEquipe,
  semNotificacao,
  textoDeSemNotificacao,
} from './equipe'
import type { MembroComPush } from './equipe'

const HOJE = '2026-09-08'
const m = ministerioDeExemplo(HOJE)
const secoes = () => secoesDaEquipe(m.membros, FUNCOES)
const secao = (chave: string) => secoes().find((s) => s.chave === chave)!
const nomes = (chave: string) => secao(chave).membros.map((linha) => linha.membro.nome)

describe('equipePorGrupo', () => {
  const pessoa = (nome: string, grupo: 'vocal' | 'instrumentos' | 'tecnica' | null, ministro = false) => ({
    membroId: nome.toLowerCase(),
    nome,
    funcoes: [],
    ministro,
    grupo,
  })

  it('junta as pessoas por Grupo na ordem Vocal, Músicos e Som, mesmo com o Ministro músico vindo na frente', () => {
    const grupos = equipePorGrupo([
      pessoa('Marcos', 'instrumentos', true),
      pessoa('Ana', 'vocal'),
      pessoa('Pedro', 'instrumentos'),
      pessoa('Davi', 'tecnica'),
    ])

    expect(grupos.map((grupo) => [grupo.nome, grupo.pessoas.map((p) => p.nome)])).toEqual([
      ['Vocal', ['Ana']],
      ['Músicos', ['Marcos', 'Pedro']],
      ['Som', ['Davi']],
    ])
  })

  it('deixa quem não tem Função num grupo próprio, por último, e some com grupo vazio', () => {
    const grupos = equipePorGrupo([pessoa('Bia', null), pessoa('Ana', 'vocal')])

    expect(grupos.map((grupo) => grupo.nome)).toEqual(['Vocal', 'Sem função'])
  })
})

describe('linhaDaEquipe', () => {
  const pessoa = (id: string, nome: string, ministro = false) => ({ membroId: id, nome, funcoes: ['Vocal'], ministro })

  it('resume quem dirige e os demais numa frase, com as iniciais', () => {
    expect(linhaDaEquipe([pessoa('marcos', 'Marcos', true), pessoa('bia', 'Bia'), pessoa('gabriel', 'Gabriel')])).toEqual({
      total: 3,
      iniciais: ['M', 'B', 'G'],
      extras: 0,
      texto: 'Marcos dirige · Bia e Gabriel',
    })
  })

  it('junta dois Ministros e, acima de seis pessoas, mostra cinco iniciais e a conta do resto', () => {
    const muitos = [
      pessoa('ana', 'Ana', true),
      pessoa('bia', 'Bia', true),
      ...['Caio', 'Davi', 'Eva', 'Fábio', 'Gil', 'Hugo'].map((nome) => pessoa(nome.toLowerCase(), nome)),
    ]

    const linha = linhaDaEquipe(muitos)

    expect(linha.texto).toBe('Ana e Bia dirigem · Caio, Davi, Eva, Fábio, Gil e Hugo')
    expect(linha.iniciais).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(linha.extras).toBe(3)
  })

  it('sem ninguém, não inventa frase', () => {
    expect(linhaDaEquipe([])).toEqual({ total: 0, iniciais: [], extras: 0, texto: '' })
  })
})

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

describe('musicosDaFormacao', () => {
  const lista = musicosDaFormacao(m.membros, FUNCOES)

  it('traz quem tem Função de instrumento, mesmo quem também canta', () => {
    expect(lista.map((linha) => linha.membro.id)).toContain('marcos')
    expect(lista.map((linha) => linha.membro.id)).not.toContain('davi')
    expect(lista.map((linha) => linha.membro.id)).not.toContain('isa')
  })

  it('mostra só as Funções de instrumento de cada um', () => {
    const marcos = lista.find((linha) => linha.membro.id === 'marcos')

    expect(marcos?.funcoes.map((funcao) => funcao.id)).toEqual(['violao'])
  })
})

describe('quem não recebe notificação', () => {
  const equipe = [
    { membroId: 'ana', funcoes: ['vocal'], ministro: false },
    { membroId: 'isa', funcoes: [], ministro: true },
    { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
  ]

  const comAparelhos = (mudos: Record<string, Partial<MembroComPush>>) =>
    m.membros.map((membro) => ({ ...membro, push: 1, ...mudos[membro.id] }))

  it('conta o silenciado igual a quem não tem aparelho', () => {
    expect(naoRecebeNotificacao({ ...m.membros[0], push: 2, silenciado: true }, true)).toBe(true)
  })

  it('lista só os escalados que não vão receber', () => {
    const membros = comAparelhos({ ana: { push: 0 }, isa: { silenciado: true }, lucas: { push: 0 } })

    expect(semNotificacao(membros, equipe)).toEqual(['Isa', 'Ana'])
  })

  it('escreve a dica com as pessoas e nada quando todo mundo recebe', () => {
    expect(textoDeSemNotificacao(['Ana', 'Isa', 'Gabriel'])).toBe('3 pessoas sem notificação: Ana, Isa, Gabriel')
    expect(textoDeSemNotificacao(['Ana'])).toBe('1 pessoa sem notificação: Ana')
    expect(textoDeSemNotificacao([])).toBeNull()
  })
})

describe('memória da pessoa', () => {
  const comPresenca = (presenca: MembroComPush['presenca']) => ({ ...m.membros[0], presenca })

  it('diz quando foi a última vez', () => {
    const memoria = memoriaDoMembro(comPresenca({ ultimaVez: '2026-08-16', seguidos: 1, paradaHaMeses: 0 }), HOJE)

    expect(memoria.texto).toBe('última há 3 semanas')
    expect(memoria.alerta).toBeNull()
  })

  it('avisa quem nunca esteve numa Escala', () => {
    const memoria = memoriaDoMembro(comPresenca({ ultimaVez: null, seguidos: 0, paradaHaMeses: null }), HOJE)

    expect(memoria.texto).toBe('nenhuma escala ainda')
  })

  it('alerta quem está há quatro fins de semana seguidos', () => {
    const memoria = memoriaDoMembro(comPresenca({ ultimaVez: '2026-09-06', seguidos: 4, paradaHaMeses: 0 }), HOJE)

    expect(memoria.alerta).toBe('4 seguidos')
  })

  it('alerta quem parou há dois meses ou mais', () => {
    const memoria = memoriaDoMembro(comPresenca({ ultimaVez: '2026-06-07', seguidos: 0, paradaHaMeses: 3 }), HOJE)

    expect(memoria.alerta).toBe('3 meses sem escala')
  })

  it('deixa passar quem parou há um mês só', () => {
    const memoria = memoriaDoMembro(comPresenca({ ultimaVez: '2026-08-09', seguidos: 0, paradaHaMeses: 1 }), HOJE)

    expect(memoria.alerta).toBeNull()
  })
})

describe('ordem das pessoas na seção', () => {
  it('põe os escalados em cima e o resto em ordem alfabética', () => {
    const linhas = secao('musicos').membros
    const equipe = [{ membroId: 'pedro', funcoes: ['baixo'], ministro: false }]
    const ordenadas = ordenarPorEscalados(linhas, equipe)

    expect(ordenadas[0].membro.id).toBe('pedro')
    expect(ordenadas.slice(1).map((linha) => linha.membro.nome)).toEqual(
      [...ordenadas.slice(1)].map((linha) => linha.membro.nome).sort((a, b) => a.localeCompare(b)),
    )
  })
})

describe('resumo da Equipe', () => {
  const selos = (equipe: { membroId: string; funcoes: string[]; ministro: boolean }[]) =>
    resumoDaEquipe(FUNCOES, equipe, m.membros)

  it('põe o que falta em atenção e o que está completo em sucesso', () => {
    const resumo = selos([
      { membroId: 'isa', funcoes: ['vocal'], ministro: true },
      { membroId: 'ana', funcoes: ['vocal'], ministro: false },
      { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
    ])

    expect(resumo[0]).toEqual({ chave: 'vocal', texto: 'vocal 2 de 2', variante: 'sucesso' })
    expect(resumo[1].variante).toBe('atencao')
    expect(resumo[1].texto).toContain('músicos 1 de 3')
  })

  it('fecha com quem dirige', () => {
    const resumo = selos([{ membroId: 'isa', funcoes: ['vocal'], ministro: true }])

    expect(resumo[resumo.length - 1]).toEqual({ chave: 'ministro', texto: 'ministro: Isa', variante: 'ministro' })
  })

  it('junta os nomes quando mais de um dirige', () => {
    const resumo = selos([
      { membroId: 'isa', funcoes: [], ministro: true },
      { membroId: 'marcos', funcoes: [], ministro: true },
    ])

    expect(resumo[resumo.length - 1].texto).toBe('ministros: Isa e Marcos')
  })

  it('cobra o Ministro quando ninguém tem a marca', () => {
    const resumo = selos([{ membroId: 'ana', funcoes: ['vocal'], ministro: false }])

    expect(resumo[resumo.length - 1]).toEqual({ chave: 'ministro', texto: 'sem ministro', variante: 'atencao' })
  })

  it('deixa o Grupo sem mínimo em neutro', () => {
    const semMinimo = FUNCOES.map((funcao) => ({ ...funcao, minimo: 0 }))

    expect(resumoDaEquipe(semMinimo, [], m.membros)[0]).toEqual({
      chave: 'vocal',
      texto: 'vocal 0',
      variante: 'neutro',
    })
  })
})

describe('avisos de cada toque', () => {
  it('fala da Função que entrou e da que saiu', () => {
    expect(mensagemDaFuncao('Ana', 'Vocal', false, { funcoes: ['vocal'], ministro: false })).toBe('Vocal: Ana entrou')
    expect(mensagemDaFuncao('Ana', 'Vocal', true, { funcoes: ['violao'], ministro: false })).toBe('Vocal: Ana saiu')
  })

  it('diz que a pessoa saiu da equipe quando não sobra nada', () => {
    expect(mensagemDaFuncao('Ana', 'Vocal', true, { funcoes: [], ministro: false })).toBe('Ana saiu da equipe')
    expect(mensagemDoMinistro('Isa', true, { funcoes: [], ministro: false })).toBe('Isa saiu da equipe')
  })

  it('fala de quem dirige sem inventar gênero', () => {
    expect(mensagemDoMinistro('Isa', false, { funcoes: ['vocal'], ministro: true })).toBe('Isa dirige esta escala')
    expect(mensagemDoMinistro('Isa', true, { funcoes: ['vocal'], ministro: false })).toBe('Isa não dirige mais')
  })
})
