import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { hojeEmBrasilia, somarDias } from '../../src/dominio'
import type { Letra } from '../../src/dominio'
import { criarAnexo } from '../dados/anexos'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'

const RAIZ = 'http://local.test'
const WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const hoje = hojeEmBrasilia()

type TomDoCulto = { valor: string; origem: string; data?: string; ministradoPorNome?: string | null }

type MusicaDoCulto = {
  id: string
  titulo: string
  artista: string
  tom: TomDoCulto | null
  vezesTocada: number
  letra: Letra | null
}

type TrechoDoCulto = { musicaId: string; titulo: string; artista: string; tom: string; inicio: string; fim: string }

type ItemDoCulto = {
  id: string
  tipo: string
  musicaId?: string
  titulo?: string
  artista?: string
  tom?: string
  inicio?: string | null
  fim?: string | null
  observacao: string
  trechos?: TrechoDoCulto[]
  letra?: Letra | null
}

type EscalaDoCulto = { id: string; data: string; horario: string; titulo: string; itens: ItemDoCulto[] }

type Pacote = { geradoEm: string; escalas: EscalaDoCulto[]; catalogo: MusicaDoCulto[] }

function letraDe(texto: string): Letra {
  return { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto, forte: false }] }] }
}

async function porLetra(dono: { musicaId: string } | { itemId: string }, texto: string): Promise<void> {
  await criarAnexo(env.DB, dono, {
    nome: 'Sequência.docx',
    mime: WORD,
    conteudo: new ArrayBuffer(8),
    letra: letraDe(texto),
  })
}

async function ajustarMusica(id: string, campos: Record<string, string | number | null>): Promise<void> {
  const colunas = Object.keys(campos)
    .map((coluna) => `${coluna} = ?`)
    .join(', ')

  await env.DB.prepare(`update musicas set ${colunas} where id = ?`)
    .bind(...Object.values(campos), id)
    .run()
}

async function criarMedley(id: string, escalaId: string, trechos: [string, string][], ordem = 1): Promise<void> {
  await env.DB.prepare('insert into itens (id, escala_id, ordem, tipo, observacao) values (?, ?, ?, ?, ?)')
    .bind(id, escalaId, ordem, 'medley', 'Emendar sem parar')
    .run()

  for (const [posicao, [musicaId, tom]] of trechos.entries()) {
    await env.DB.prepare(
      'insert into trechos (id, item_id, ordem, musica_id, tom, inicio, fim) values (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(`${id}-t${posicao}`, id, posicao, musicaId, tom, '0:00', '2:30')
      .run()
  }
}

async function pedir(quem = 'julia'): Promise<Pacote> {
  const resposta = await SELF.fetch(`${RAIZ}/api/culto/pacote`, { headers: { cookie: await cookieDe(quem) } })
  expect(resposta.status).toBe(200)
  return resposta.json<Pacote>()
}

function doCatalogo(pacote: Pacote, musicaId: string): MusicaDoCulto | undefined {
  return pacote.catalogo.find((musica) => musica.id === musicaId)
}

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
  await criarMusica('dono', 'Dono do Mundo', 'aaaaaaaaaaa')
  await criarMusica('sublime', 'Sublime', 'bbbbbbbbbbb')
})

describe('GET /api/culto/pacote', () => {
  it('exige sessão', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/culto/pacote`)).status).toBe(401)
  })

  it('traz as Escalas de hoje até trinta dias, com geradoEm', async () => {
    await criarEscala({ id: 'hoje', data: hoje })
    await criarEscala({ id: 'no-limite', data: somarDias(hoje, 30) })
    await criarEscala({ id: 'longe', data: somarDias(hoje, 31) })
    await criarEscala({ id: 'ontem', data: somarDias(hoje, -1) })

    const pacote = await pedir()

    expect(pacote.escalas.map((escala) => escala.id)).toEqual(['hoje', 'no-limite'])
    expect(pacote.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('deixa a cancelada de fora', async () => {
    await criarEscala({ id: 'hoje', data: hoje })
    await criarEscala({ id: 'cancelada', data: somarDias(hoje, 2), cancelada: true })

    expect((await pedir()).escalas.map((escala) => escala.id)).toEqual(['hoje'])
  })

  it('descreve a Escala com título, horário e Itens', async () => {
    await criarEscala({ id: 'hoje', data: hoje, horario: '18:00', rotulo: 'Culto de Domingo' })
    await criarItemInteira('i1', 'hoje', 'rio', 'D')
    await env.DB.prepare('update itens set observacao = ? where id = ?').bind('Começar mais baixo', 'i1').run()

    const escala = (await pedir()).escalas[0]

    expect(escala).toMatchObject({ id: 'hoje', data: hoje, horario: '18:00', titulo: 'Culto de Domingo 18h' })
    expect(escala.itens).toEqual([
      {
        id: 'i1',
        tipo: 'inteira',
        musicaId: 'rio',
        titulo: 'Rio',
        artista: 'Canal',
        tom: 'D',
        inicio: null,
        fim: null,
        observacao: 'Começar mais baixo',
      },
    ])
  })

  it('leva a letra do Item no Medley e os trechos com tom', async () => {
    await criarEscala({ id: 'hoje', data: hoje })
    await criarMedley('i2', 'hoje', [
      ['rio', 'D'],
      ['sublime', 'A'],
    ])
    await porLetra({ itemId: 'i2' }, 'Maranata, maranata')

    const item = (await pedir()).escalas[0].itens[0]

    expect(item).toMatchObject({ id: 'i2', tipo: 'medley', observacao: 'Emendar sem parar' })
    expect(item.trechos).toEqual([
      { musicaId: 'rio', titulo: 'Rio', artista: 'Canal', tom: 'D', inicio: '0:00', fim: '2:30' },
      { musicaId: 'sublime', titulo: 'Sublime', artista: 'Canal', tom: 'A', inicio: '0:00', fim: '2:30' },
    ])
    expect(item.letra).toEqual(letraDe('Maranata, maranata'))
  })

  it('deixa o Medley sem letra quando ninguém enviou o Word', async () => {
    await criarEscala({ id: 'hoje', data: hoje })
    await criarMedley('i2', 'hoje', [['rio', 'D']])

    expect((await pedir()).escalas[0].itens[0].letra).toBeNull()
  })

  it('leva a letra mais nova de cada Música no catálogo', async () => {
    await porLetra({ musicaId: 'rio' }, 'E me mostrou um rio')
    await porLetra({ musicaId: 'rio' }, 'Um rio de águas vivas')

    const pacote = await pedir()

    expect(doCatalogo(pacote, 'rio')?.letra).toEqual(letraDe('Um rio de águas vivas'))
    expect(doCatalogo(pacote, 'dono')?.letra).toBeNull()
  })

  it('tira as arquivadas do catálogo, menos as que as Escalas do pacote usam', async () => {
    await criarMusica('velha', 'Velha', 'ccccccccccc')
    await criarMusica('esquecida', 'Esquecida', 'ddddddddddd')
    await ajustarMusica('velha', { arquivada: 1 })
    await ajustarMusica('esquecida', { arquivada: 1 })
    await criarEscala({ id: 'hoje', data: hoje })
    await criarItemInteira('i1', 'hoje', 'velha', 'D')

    const pacote = await pedir()

    expect(doCatalogo(pacote, 'velha')).toBeDefined()
    expect(doCatalogo(pacote, 'esquecida')).toBeUndefined()
  })

  it('limpa título e artista da Música marcada pra revisar', async () => {
    await ajustarMusica('dono', { titulo: 'Dono do Mundo (Ao Vivo) | fhop music', artista: 'fhop music', revisar: 1 })

    expect(doCatalogo(await pedir(), 'dono')).toMatchObject({ titulo: 'Dono do Mundo', artista: 'fhop' })
  })

  it('dá o tom pela última Execução, com quem ministrou e quantas vezes tocou', async () => {
    await criarEscala({ id: 'passada', data: somarDias(hoje, -7) })
    await porNaEquipe('passada', 'marcos', ['vocal'], true)
    await criarItemInteira('i0', 'passada', 'rio', 'G')

    const musica = doCatalogo(await pedir(), 'rio')

    expect(musica?.tom).toEqual({
      valor: 'G',
      origem: 'execucao',
      data: somarDias(hoje, -7),
      ministradoPorNome: 'Marcos',
    })
    expect(musica?.vezesTocada).toBe(1)
  })

  it('cai no tom conhecido, no original e no nulo quando não houve Execução', async () => {
    await ajustarMusica('rio', { tom_conhecido: 'C' })
    await ajustarMusica('dono', { tom_original: 'original' })

    const pacote = await pedir()

    expect(doCatalogo(pacote, 'rio')?.tom).toEqual({ valor: 'C', origem: 'conhecido' })
    expect(doCatalogo(pacote, 'dono')?.tom).toEqual({ valor: 'original', origem: 'original' })
    expect(doCatalogo(pacote, 'sublime')?.tom).toBeNull()
    expect(doCatalogo(pacote, 'sublime')?.vezesTocada).toBe(0)
  })
})
