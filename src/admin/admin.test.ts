import { describe, expect, it } from 'vitest'
import type { Formacao, MembroComAcesso } from '../api/tipos'
import { FUNCOES } from '../dominio'
import type { Membro } from '../dominio'
import {
  LIMITE_DO_ANEXO,
  SECOES,
  alternar,
  avisoDeRemocao,
  dataDoEnvio,
  ordensDepoisDeMover,
  porGrupo,
  proximaOrdem,
  recusaDoArquivo,
  resumoDaFormacao,
  resumoDeAcesso,
  tamanhoLegivel,
  textoDaListaEsqueci,
  textoDaRemocao,
} from './admin'

function membro(campos: Partial<MembroComAcesso> = {}): MembroComAcesso {
  return {
    id: 'gabriel',
    nome: 'Gabriel',
    funcoes: ['guitarra'],
    ministro: false,
    admin: true,
    inativo: false,
    foto: null,
    sessoes: 0,
    convites: 0,
    convitesUsados: 0,
    push: 0,
    ...campos,
  }
}

describe('seções do Admin', () => {
  it('leva a uma rota própria por assunto, sem repetir caminho', () => {
    const caminhos = SECOES.map((secao) => secao.caminho)

    expect(caminhos).toEqual([...new Set(caminhos)])
    expect(caminhos.every((caminho) => caminho.startsWith('/admin/'))).toBe(true)
    expect(SECOES.every((secao) => secao.titulo && secao.dica)).toBe(true)
  })
})

describe('resumoDeAcesso', () => {
  it('conta os aparelhos de quem já entrou e diz que recebe notificação', () => {
    expect(resumoDeAcesso(membro({ sessoes: 2, push: 1 }))).toBe('2 aparelhos · recebe notificação')
  })

  it('avisa quando o Membro entrou mas nenhum aparelho recebe push', () => {
    expect(resumoDeAcesso(membro({ sessoes: 1 }))).toBe('1 aparelho · não recebe notificação')
  })

  it('mostra os convites ainda abertos de quem nunca entrou', () => {
    expect(resumoDeAcesso(membro({ convites: 2, convitesUsados: 1 }))).toBe('Nunca entrou · 1 convite aberto')
    expect(resumoDeAcesso(membro({ convites: 3 }))).toBe('Nunca entrou · 3 convites abertos')
  })

  it('diz que falta convite quando não há nenhum', () => {
    expect(resumoDeAcesso(membro())).toBe('Nunca entrou · sem convite')
  })
})

describe('porGrupo', () => {
  it('agrupa as Funções nos três grupos, cada um em ordem', () => {
    const grupos = porGrupo([...FUNCOES].reverse())

    expect(grupos.map((grupo) => grupo.nome)).toEqual(['Vocal', 'Músicos', 'Som'])
    expect(grupos[0].funcoes.map((funcao) => funcao.id)).toEqual(['vocal'])
    expect(grupos[1].funcoes.map((funcao) => funcao.id)).toEqual(['guitarra', 'violao', 'baixo', 'bateria', 'teclado'])
    expect(grupos[2].funcoes.map((funcao) => funcao.id)).toEqual(['som'])
  })

  it('mantém o grupo vazio na lista, pra ele poder receber a primeira Função', () => {
    const grupos = porGrupo(FUNCOES.filter((funcao) => funcao.grupo === 'vocal'))

    expect(grupos).toHaveLength(3)
    expect(grupos[2].funcoes).toEqual([])
  })
})

describe('proximaOrdem', () => {
  it('põe a Função nova no fim da fila', () => {
    expect(proximaOrdem(FUNCOES)).toBe(8)
  })

  it('começa em 1 quando não existe nenhuma', () => {
    expect(proximaOrdem([])).toBe(1)
  })
})

describe('remoção de Membro', () => {
  it('avisa o que a remoção apaga antes de confirmar', () => {
    expect(avisoDeRemocao(membro({ nome: 'Júlia' }))).toContain('Júlia')
    expect(avisoDeRemocao(membro({ nome: 'Júlia' }))).toContain('Equipes futuras')
  })

  it('conta o que aconteceu de verdade: apagou ou virou inativo', () => {
    expect(textoDaRemocao('Júlia', true)).toBe('Júlia saiu do ministério.')
    expect(textoDaRemocao('Gabriel', false)).toBe(
      'Gabriel já serviu em Escala Realizada: fica no histórico como inativo e sai das Equipes futuras.',
    )
  })
})

describe('resumoDaFormacao', () => {
  const membros: Membro[] = [
    { id: 'gabriel', nome: 'Gabriel', funcoes: ['guitarra'], ministro: false, admin: true, inativo: false, foto: null },
    { id: 'pedro', nome: 'Pedro', funcoes: ['baixo'], ministro: false, admin: false, inativo: false, foto: null },
  ]

  it('lista quem está dentro com as Funções entre parênteses', () => {
    const formacao: Formacao = {
      id: 'banda',
      nome: 'Banda',
      entradas: [
        { membroId: 'gabriel', funcoes: ['guitarra'] },
        { membroId: 'pedro', funcoes: ['baixo'] },
      ],
    }

    expect(resumoDaFormacao(formacao, membros, FUNCOES)).toBe('Gabriel (Guitarra), Pedro (Baixo)')
  })

  it('explica o vazio em vez de devolver texto em branco', () => {
    const formacao: Formacao = { id: 'banda', nome: 'Banda', entradas: [] }

    expect(resumoDaFormacao(formacao, membros, FUNCOES)).toBe('Vazia: monte a Equipe de uma Escala e salve por lá.')
  })

  it('ignora quem já foi removido do ministério', () => {
    const formacao: Formacao = {
      id: 'banda',
      nome: 'Banda',
      entradas: [
        { membroId: 'sumiu', funcoes: ['baixo'] },
        { membroId: 'gabriel', funcoes: ['guitarra'] },
      ],
    }

    expect(resumoDaFormacao(formacao, membros, FUNCOES)).toBe('Gabriel (Guitarra)')
  })
})

describe('recusaDoArquivo', () => {
  it('pede o arquivo quando não escolheram nenhum', () => {
    expect(recusaDoArquivo(null)).toBe('Escolha o arquivo da Sequência.')
  })

  it('só aceita Word, sem depender de maiúscula na extensão', () => {
    expect(recusaDoArquivo({ nome: 'Sequência.DOCX', tamanho: 2048 })).toBeNull()
    expect(recusaDoArquivo({ nome: 'Sequência.pdf', tamanho: 2048 })).toBe('A Sequência é um arquivo Word (.docx).')
  })

  it('recusa antes de subir o que passa de 1 MB', () => {
    expect(recusaDoArquivo({ nome: 'letra.docx', tamanho: LIMITE_DO_ANEXO + 1 })).toBe('O arquivo passa de 1 MB.')
    expect(recusaDoArquivo({ nome: 'letra.docx', tamanho: LIMITE_DO_ANEXO })).toBeNull()
  })
})

describe('tamanhoLegivel', () => {
  it('sobe de unidade sem encher a tela de dígito', () => {
    expect(tamanhoLegivel(800)).toBe('800 B')
    expect(tamanhoLegivel(2048)).toBe('2 KB')
    expect(tamanhoLegivel(1_500_000)).toBe('1,4 MB')
  })
})

describe('dataDoEnvio', () => {
  it('mostra o dia do anexo a partir do instante inteiro que o banco guarda', () => {
    expect(dataDoEnvio('2026-09-05T04:12:00.000Z', '2026-09-13')).toBe('sáb, 5 de set')
  })
})

describe('textoDaListaEsqueci', () => {
  it('explica o que cada estado significa pra quem perdeu o celular', () => {
    expect(textoDaListaEsqueci(true)).toContain('qualquer pessoa')
    expect(textoDaListaEsqueci(false)).toContain('convite')
  })
})

describe('alternar', () => {
  it('põe e tira o valor da lista sem duplicar', () => {
    expect(alternar([], 'guitarra')).toEqual(['guitarra'])
    expect(alternar(['guitarra'], 'guitarra')).toEqual([])
    expect(alternar(['vocal'], 'guitarra')).toEqual(['vocal', 'guitarra'])
  })
})

describe('ordensDepoisDeMover', () => {
  const funcoes = FUNCOES

  it('renumera a lista inteira e devolve só quem mudou de posição', () => {
    const mudancas = ordensDepoisDeMover(funcoes, 'instrumentos', 0, 2)

    expect(mudancas).toEqual([
      { id: 'violao', ordem: 2 },
      { id: 'baixo', ordem: 3 },
      { id: 'guitarra', ordem: 4 },
    ])
  })

  it('não mexe em quem está em outro grupo', () => {
    const mudancas = ordensDepoisDeMover(funcoes, 'instrumentos', 0, 1)

    expect(mudancas.some((mudanca) => ['vocal', 'som'].includes(mudanca.id))).toBe(false)
  })

  it('devolve nada quando o item fica no lugar', () => {
    expect(ordensDepoisDeMover(funcoes, 'instrumentos', 1, 1)).toEqual([])
  })
})
