import { SELF, env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hojeEmBrasilia } from '../../src/dominio'
import { limparCacheDeVideos } from '../dados/oembed'
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
import { fingirRede } from '../testes/rede'

const RAIZ = 'http://local.test'
const FUTURO = '2099-08-16'
const MEIA_NOITE = 'hRJUcvsnqKs'

type NaLista = {
  id: string
  titulo: string
  legado: boolean
  nova: boolean
  arquivada: boolean
  revisar: boolean
  capa: string
  ultimaExecucao: { data: string; tom: string; parcial: boolean } | null
}

afterEach(() => vi.unstubAllGlobals())

beforeEach(async () => {
  limparCacheDeVideos()
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarFuncao('guitarra', 'instrumentos', 3)
  await criarFuncao('som', 'tecnica', 8)
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['guitarra'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'davi', nome: 'Davi', funcoes: ['som'] })

  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
  await criarMusica('dono', 'Dono da Minha Afeição', '2anDhu7L-Cc')
  await criarMusica('sublime', 'Sublime', '7GWZwO0MdsY')

  await criarEscala({ id: 'e2020', data: '2020-08-16' })
  await porNaEquipe('e2020', 'marcos', ['vocal'], true)
  await porNaEquipe('e2020', 'gabriel', ['guitarra'])
  await porNaEquipe('e2020', 'davi', ['som'])
  await criarItemInteira('i2020', 'e2020', 'rio', 'D')

  await criarEscala({ id: 'e2022', data: '2022-05-01' })
  await porNaEquipe('e2022', 'marcos', ['vocal'], true)
  await criarItemInteira('i2022', 'e2022', 'dono', 'F')

  await criarEscala({ id: 'e1', data: FUTURO })
  await porNaEquipe('e1', 'marcos', ['vocal'], true)
  await porNaEquipe('e1', 'julia', ['vocal'])
})

function mesesAtras(quantidade: number): string {
  const [ano, mes] = hojeEmBrasilia().split('-').map(Number)
  const dia = new Date(Date.UTC(ano, mes - 1 - quantidade, 15, 12))
  return dia.toISOString().slice(0, 10)
}

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

async function listar(consulta: string, quem = 'marcos'): Promise<NaLista[]> {
  const resposta = await pedir('/api/musicas' + consulta, quem)
  return (await resposta.json<{ musicas: NaLista[] }>()).musicas
}

describe('resolver link', () => {
  it('traz título, canal e capa do oEmbed e diz que não está no catálogo', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite', author_name: 'Fhop Music' } } })

    const resposta = await pedir('/api/musicas/resolver', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://youtu.be/' + MEIA_NOITE }),
    })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({
      videoId: MEIA_NOITE,
      titulo: 'Meia Noite',
      canal: 'Fhop Music',
      capa: `https://i.ytimg.com/vi/${MEIA_NOITE}/maxresdefault.jpg`,
      musica: null,
    })
  })

  it('devolve a Música quando o vídeo já está no catálogo', async () => {
    fingirRede({ s1oU: { status: 200, corpo: { title: 'Rio', author_name: 'Nívea Soares' } } })

    const resposta = await pedir('/api/musicas/resolver', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://www.youtube.com/watch?v=s1oU-6vYc4E' }),
    })

    const corpo = await resposta.json<{ musica: { id: string } | null }>()

    expect(corpo.musica?.id).toBe('rio')
  })

  it('recusa link que não é do YouTube', async () => {
    const resposta = await pedir('/api/musicas/resolver', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://exemplo.com/musica' }),
    })

    expect(resposta.status).toBe(422)
  })

  it('devolve 404 quando o YouTube não conhece o vídeo', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 404 } })

    const resposta = await pedir('/api/musicas/resolver', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: MEIA_NOITE }),
    })

    expect(resposta.status).toBe(404)
  })

  it('deixa o Membro comum resolver, que é como ele sugere por link', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite' } } })

    const resposta = await pedir('/api/musicas/resolver', 'julia', {
      method: 'POST',
      body: JSON.stringify({ link: MEIA_NOITE }),
    })

    expect(resposta.status).toBe(200)
  })
})

describe('criar Música', () => {
  it('cadastra pelo link, com título e canal do oEmbed, sem Legado e sem revisar', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite', author_name: 'Fhop Music' } } })

    const resposta = await pedir('/api/musicas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://youtu.be/' + MEIA_NOITE }),
    })

    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({
      titulo: 'Meia Noite',
      artista: 'Fhop Music',
      videoId: MEIA_NOITE,
      legado: false,
      nova: true,
      revisar: false,
    })
  })

  it('o título informado ganha do que veio do oEmbed', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite (Ao Vivo)' } } })

    const resposta = await pedir('/api/musicas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: MEIA_NOITE, titulo: 'Meia Noite', artista: 'Fhop', tomOriginal: 'G' }),
    })

    expect(await resposta.json()).toMatchObject({ titulo: 'Meia Noite', artista: 'Fhop', tomOriginal: 'G' })
  })

  it('recusa vídeo que já está no catálogo e devolve a Música existente', async () => {
    fingirRede({ s1oU: { status: 200, corpo: { title: 'Rio' } } })

    const resposta = await pedir('/api/musicas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://youtu.be/s1oU-6vYc4E' }),
    })

    expect(resposta.status).toBe(409)
    expect((await resposta.json<{ musica: { id: string } }>()).musica.id).toBe('rio')
  })

  it('recusa Membro comum', async () => {
    const resposta = await pedir('/api/musicas', 'julia', {
      method: 'POST',
      body: JSON.stringify({ link: MEIA_NOITE }),
    })

    expect(resposta.status).toBe(403)
  })
})

describe('listar Músicas', () => {
  it('ordena por última Execução, faz mais tempo primeiro, e as sem Execução no fim', async () => {
    const musicas = await listar('')

    expect(musicas.map((m) => m.id)).toEqual(['rio', 'dono', 'sublime'])
    expect(musicas[0].ultimaExecucao).toMatchObject({ data: '2020-08-16', tom: 'D', parcial: false })
    expect(musicas[2].ultimaExecucao).toBeNull()
  })

  it('esconde as arquivadas, e mostra quando pedem', async () => {
    await env.DB.prepare('update musicas set arquivada = 1 where id = ?').bind('sublime').run()

    expect((await listar('')).map((m) => m.id)).toEqual(['rio', 'dono'])
    expect((await listar('?arquivadas=1')).map((m) => m.id)).toEqual(['rio', 'dono', 'sublime'])
  })

  it('marca Legado quem veio da playlist e nunca foi tocada', async () => {
    const musicas = await listar('')

    expect(musicas.find((m) => m.id === 'sublime')?.legado).toBe(true)
    expect(musicas.find((m) => m.id === 'rio')?.legado).toBe(false)
  })

  it('o filtro nova traz só as sem Execução e sem Legado', async () => {
    await criarMusica('nova', 'Canção Nova', 'CmM1pcHohdI')
    await env.DB.prepare('update musicas set legado = 0 where id = ?').bind('nova').run()

    expect((await listar('?filtro=nova')).map((m) => m.id)).toEqual(['nova'])
  })

  it('o filtro legado traz só as importadas ainda não tocadas', async () => {
    expect((await listar('?filtro=legado')).map((m) => m.id)).toEqual(['sublime'])
  })

  it('o filtro revisar traz as que precisam de título e artista conferidos', async () => {
    await env.DB.prepare('update musicas set revisar = 1 where id = ?').bind('dono').run()

    expect((await listar('?filtro=revisar')).map((m) => m.id)).toEqual(['dono'])
  })

  it('busca sem acento e sem ligar pra caixa, no título e no artista', async () => {
    expect((await listar('?busca=afeicao')).map((m) => m.id)).toEqual(['dono'])
    expect((await listar('?busca=RIO')).map((m) => m.id)).toEqual(['rio'])
    expect(await listar('?busca=aleluia')).toEqual([])
  })

  it('o filtro de meses traz só quem tem Execução mais velha que o pedido', async () => {
    await criarEscala({ id: 'erecente', data: mesesAtras(3) })
    await porNaEquipe('erecente', 'marcos', ['vocal'], true)
    await criarItemInteira('irecente', 'erecente', 'sublime', 'A')

    const musicas = await listar('?meses=12')

    expect(musicas.map((m) => m.id)).toEqual(['rio', 'dono'])
  })

  it('deixa o Membro comum ver o catálogo', async () => {
    expect((await listar('', 'julia')).length).toBe(3)
  })
})

describe('detalhe da Música', () => {
  it('traz histórico de Tons com quem ministrou, Tom sugerido e link do Cifra Club', async () => {
    const resposta = await pedir('/api/musicas/rio', 'julia')

    expect(resposta.status).toBe(200)
    const corpo = await resposta.json<{
      titulo: string
      cifraClub: string
      tomSugerido: { tom: string; origem: string; ministradoPorNome: string | null }
      historico: { data: string; tom: string; parcial: boolean; ministradoPorNome: string | null }[]
    }>()

    expect(corpo.titulo).toBe('Rio')
    expect(corpo.cifraClub).toBe('https://www.cifraclub.com.br/?q=Rio')
    expect(corpo.tomSugerido).toMatchObject({ tom: 'D', origem: 'execucao', ministradoPorNome: 'Marcos' })
    expect(corpo.historico).toHaveLength(1)
    expect(corpo.historico[0]).toMatchObject({ data: '2020-08-16', tom: 'D', parcial: false, ministradoPorNome: 'Marcos' })
  })

  it('sugere o tom conhecido quando não há Execução', async () => {
    await env.DB.prepare('update musicas set tom_conhecido = ? where id = ?').bind('A', 'sublime').run()

    const resposta = await pedir('/api/musicas/sublime', 'marcos')

    expect(await resposta.json()).toMatchObject({ tomSugerido: { tom: 'A', origem: 'conhecido' } })
  })

  it('traz a cobertura da Equipe quando dizem a Escala', async () => {
    const resposta = await pedir('/api/musicas/rio?escalaId=e1', 'marcos')

    const { cobertura } = await resposta.json<{ cobertura: { ja: string[]; nunca: string[] } }>()

    expect(cobertura).toEqual({ ja: ['Marcos'], nunca: ['Júlia'] })
  })

  it('não credita a Função técnica na cobertura', async () => {
    const resposta = await pedir('/api/musicas/rio?escalaId=e2020', 'marcos')

    const { cobertura } = await resposta.json<{ cobertura: { ja: string[]; nunca: string[] } }>()

    expect(cobertura.ja).toEqual(['Marcos', 'Gabriel'])
  })

  it('devolve 404 numa Música que não existe', async () => {
    expect((await pedir('/api/musicas/nao-existe', 'marcos')).status).toBe(404)
  })
})

describe('editar Música', () => {
  it('muda título, artista, tom conhecido e a marca de revisar', async () => {
    await env.DB.prepare('update musicas set revisar = 1 where id = ?').bind('sublime').run()

    const resposta = await pedir('/api/musicas/sublime', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ titulo: 'Sublime Graça', artista: 'Fhop Music', tomConhecido: 'A', revisar: false }),
    })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({
      titulo: 'Sublime Graça',
      artista: 'Fhop Music',
      tomConhecido: 'A',
      revisar: false,
    })
  })

  it('limpa o tom conhecido com nulo', async () => {
    await env.DB.prepare('update musicas set tom_conhecido = ? where id = ?').bind('A', 'sublime').run()

    const resposta = await pedir('/api/musicas/sublime', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ tomConhecido: null }),
    })

    expect(await resposta.json()).toMatchObject({ tomConhecido: null })
  })

  it('recusa título vazio', async () => {
    const resposta = await pedir('/api/musicas/sublime', 'marcos', {
      method: 'PATCH',
      body: JSON.stringify({ titulo: '  ' }),
    })

    expect(resposta.status).toBe(422)
  })
})

describe('apagar e arquivar', () => {
  it('apaga a Música que nunca foi tocada', async () => {
    const resposta = await pedir('/api/musicas/sublime', 'marcos', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    expect((await listar('?arquivadas=1')).map((m) => m.id)).toEqual(['rio', 'dono'])
  })

  it('recusa apagar Música com Execução e manda arquivar', async () => {
    const resposta = await pedir('/api/musicas/rio', 'marcos', { method: 'DELETE' })

    expect(resposta.status).toBe(409)
    expect((await resposta.json<{ erro: string }>()).erro).toBe(
      'Rio já foi tocada: arquive em vez de apagar.',
    )
  })

  it('recusa apagar Música que está no Repertório de uma Escala Agendada', async () => {
    await criarItemInteira('i1', 'e1', 'sublime', 'A')

    const resposta = await pedir('/api/musicas/sublime', 'marcos', { method: 'DELETE' })

    expect(resposta.status).toBe(409)
    expect((await resposta.json<{ erro: string }>()).erro).toBe(
      'Sublime está no Repertório de uma Escala. Tire de lá antes de apagar.',
    )
  })

  it('arquiva a Música com Execução e ela some do catálogo', async () => {
    const resposta = await pedir('/api/musicas/rio/arquivar', 'marcos', { method: 'POST' })

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toMatchObject({ arquivada: true })
    expect((await listar('')).map((m) => m.id)).toEqual(['dono', 'sublime'])
  })

  it('recusa arquivar Música sem Execução e manda apagar', async () => {
    const resposta = await pedir('/api/musicas/sublime/arquivar', 'marcos', { method: 'POST' })

    expect(resposta.status).toBe(422)
    expect((await resposta.json<{ erro: string }>()).erro).toBe(
      'Sublime nunca foi tocada: apague em vez de arquivar.',
    )
  })

  it('desarquiva', async () => {
    await pedir('/api/musicas/rio/arquivar', 'marcos', { method: 'POST' })

    const resposta = await pedir('/api/musicas/rio/desarquivar', 'marcos', { method: 'POST' })

    expect(await resposta.json()).toMatchObject({ arquivada: false })
    expect((await listar('')).map((m) => m.id)).toEqual(['rio', 'dono', 'sublime'])
  })

  it('recusa Membro comum', async () => {
    expect((await pedir('/api/musicas/sublime', 'julia', { method: 'DELETE' })).status).toBe(403)
  })
})
