import { SELF, env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hojeEmBrasilia, somarDias } from '../../src/dominio'
import { CHAVE_SEMANAS_DE_REPETICAO } from '../dados/configuracoes'
import { limparCacheDeVideos } from '../dados/oembed'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  definirConfiguracao,
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
  aba: string
  secao: string | null
  recente: boolean
  planejadaEm: { escalaId: string; data: string; titulo: string; ministros: string[] }[]
  vezesTocada: number
  vezesEm6Meses: number
  temLetra: boolean
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
  it('cadastra pelo link com o título já limpo, sem Legado e marcada pra revisar', async () => {
    fingirRede({
      [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite (Ao Vivo) | fhop music', author_name: 'fhop music' } },
    })

    const resposta = await pedir('/api/musicas', 'marcos', {
      method: 'POST',
      body: JSON.stringify({ link: 'https://youtu.be/' + MEIA_NOITE }),
    })

    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({
      titulo: 'Meia Noite',
      artista: 'fhop',
      videoId: MEIA_NOITE,
      legado: false,
      nova: true,
      revisar: true,
    })

    const guardada = await env.DB.prepare('select titulo, artista, revisar from musicas where video_id = ?')
      .bind(MEIA_NOITE)
      .first<{ titulo: string; artista: string; revisar: number }>()
    expect(guardada).toEqual({ titulo: 'Meia Noite', artista: 'fhop', revisar: 1 })
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

describe('buscar no YouTube', () => {
  const RESPOSTA = {
    items: [
      { id: { videoId: MEIA_NOITE }, snippet: { title: 'Meia Noite (Ao Vivo)', channelTitle: 'Fhop Music' } },
      { id: { videoId: 'VPQ2NqTdWM8' }, snippet: { title: 'Eric &amp; Evellyn', channelTitle: 'TELOS' } },
    ],
  }

  it('devolve os vídeos achados pelo título, com o & do YouTube desfeito', async () => {
    const rede = fingirRede({ 'youtube/v3/search': { status: 200, corpo: RESPOSTA } })

    const resposta = await pedir('/api/musicas/buscar?termo=meia%20noite', 'marcos')
    const corpo = await resposta.json<{ achados: { videoId: string; titulo: string; canal: string }[] }>()

    expect(resposta.status).toBe(200)
    expect(corpo.achados).toEqual([
      expect.objectContaining({ videoId: MEIA_NOITE, titulo: 'Meia Noite (Ao Vivo)', canal: 'Fhop Music' }),
      expect.objectContaining({ videoId: 'VPQ2NqTdWM8', titulo: 'Eric & Evellyn' }),
    ])
    expect(rede.chamadas[0]).toContain('q=meia%20noite')
  })

  it('recusa busca vazia', async () => {
    expect((await pedir('/api/musicas/buscar?termo=%20', 'marcos')).status).toBe(422)
  })

  it('avisa quando a chave da API não está configurada', async () => {
    const guardada = env.YOUTUBE_API_KEY
    env.YOUTUBE_API_KEY = undefined

    const resposta = await pedir('/api/musicas/buscar?termo=meia', 'marcos')

    expect(resposta.status).toBe(503)
    env.YOUTUBE_API_KEY = guardada
  })

  it('avisa quando o YouTube recusa a chamada', async () => {
    fingirRede({ 'youtube/v3/search': { status: 403 } })

    expect((await pedir('/api/musicas/buscar?termo=meia', 'marcos')).status).toBe(502)
  })
})

describe('tom pelo Cifra Club', () => {
  const PAGINA = '<div id="key"><p>Tom</p><p class="x">F#m</p></div>'

  it('devolve a música achada e o tom, pro Ministro confirmar', async () => {
    const rede = fingirRede({
      'solr.sscdn.co': {
        status: 200,
        corpo: { response: { docs: [{ t: '2', m: 'Rio', a: 'Nívea Soares', d: 'nivea-soares', u: 'rio' }] } },
      },
      'cifraclub.com.br/nivea-soares/rio': { status: 200, texto: PAGINA },
    })

    const resposta = await pedir('/api/cifraclub?termo=rio%20nivea', 'marcos')

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toEqual({
      achado: {
        titulo: 'Rio',
        artista: 'Nívea Soares',
        tom: 'F#m',
        url: 'https://www.cifraclub.com.br/nivea-soares/rio/',
      },
    })
    expect(rede.chamadas[0]).toContain('solr.sscdn.co')
    expect(rede.chamadas[0]).toContain('rio%20nivea')
  })

  it('devolve nada quando a busca não acha a música', async () => {
    fingirRede({ 'solr.sscdn.co': { status: 200, corpo: { response: { docs: [] } } } })

    const resposta = await pedir('/api/cifraclub?termo=rio', 'marcos')

    expect(resposta.status).toBe(200)
    expect(await resposta.json()).toEqual({ achado: null })
  })

  it('devolve nada quando a página não mostra o tom', async () => {
    fingirRede({
      'solr.sscdn.co': {
        status: 200,
        corpo: { response: { docs: [{ t: '2', m: 'Rio', a: 'Nívea Soares', d: 'nivea-soares', u: 'rio' }] } },
      },
      'cifraclub.com.br/nivea-soares/rio': { status: 200, texto: '<div>sem cartão</div>' },
    })

    expect(await (await pedir('/api/cifraclub?termo=rio', 'marcos')).json()).toEqual({ achado: null })
  })

  it('Membro comum não consulta', async () => {
    expect((await pedir('/api/cifraclub?termo=rio', 'julia')).status).toBe(403)
  })

  it('recusa busca vazia', async () => {
    expect((await pedir('/api/cifraclub?termo=%20', 'marcos')).status).toBe(422)
  })

  it('recusa o achado que não combina com o título e segue tentando', async () => {
    const rede = fingirRede({
      'solr.sscdn.co': {
        status: 200,
        corpo: {
          response: {
            docs: [{ t: '2', m: 'Quero Conhecer Jesus', a: 'Alessandro Vilas Boas', d: 'avb', u: 'quero' }],
          },
        },
      },
    })

    const resposta = await pedir(
      '/api/cifraclub?termo=Alessandro%20Vilas%20Boas%20-%20Vem%20Habitar&artista=Alessandro%20Vilas%20Boas',
      'marcos',
    )

    expect(await resposta.json()).toEqual({ achado: null })
    expect(rede.chamadas.length).toBeGreaterThan(1)
  })

  it('tenta de novo só com o título quando o canal afunda a busca', async () => {
    const rede = fingirRede({
      'solr.sscdn.co': { status: 200, corpo: { response: { docs: [] } } },
    })

    await pedir('/api/cifraclub?termo=Permanecerei&artista=ONE%20Sounds', 'marcos')

    expect(rede.chamadas).toHaveLength(2)
    expect(rede.chamadas[0]).toContain('Permanecerei%20ONE%20Sounds')
    expect(rede.chamadas[1]).toContain('q=Permanecerei&')
  })
})

describe('listar Músicas', () => {
  it('sai em ordem estável por título, com a última Execução de cada uma', async () => {
    const musicas = await listar('')

    expect(musicas.map((m) => m.id)).toEqual(['dono', 'rio', 'sublime'])
    expect(musicas[1].ultimaExecucao).toMatchObject({ data: '2020-08-16', tom: 'D', parcial: false })
    expect(musicas[2].ultimaExecucao).toBeNull()
  })

  it('traz o limite de repetição junto com a lista, 4 por padrão', async () => {
    const resposta = await pedir('/api/musicas', 'julia')
    const corpo = await resposta.json<{ semanasDeRepeticao: number }>()

    expect(corpo.semanasDeRepeticao).toBe(4)

    await definirConfiguracao(CHAVE_SEMANAS_DE_REPETICAO, '8')
    expect((await (await pedir('/api/musicas', 'julia')).json<{ semanasDeRepeticao: number }>()).semanasDeRepeticao).toBe(8)
  })

  it('cada Música diz a aba, a seção, se é recente, quantas vezes tocou e se tem letra', async () => {
    await criarEscala({ id: 'erecente', data: somarDias(hojeEmBrasilia(), -10) })
    await porNaEquipe('erecente', 'marcos', ['vocal'], true)
    await criarItemInteira('irecente', 'erecente', 'dono', 'F')
    await env.DB.prepare(
      "insert into anexos (id, musica_id, nome, mime, tamanho, conteudo, letra, versao, criado_em) values ('a1', 'rio', 'Rio.docx', 'application/octet-stream', 1, x'00', '{\"cabecalho\":[],\"blocos\":[]}', 1, '2026-09-01T00:00:00.000Z')",
    ).run()

    const musicas = await listar('')
    const porId = Object.fromEntries(musicas.map((m) => [m.id, m]))

    expect(porId.dono).toMatchObject({ aba: 'recentes', secao: null, recente: true, vezesTocada: 2, vezesEm6Meses: 1, temLetra: false })
    expect(porId.rio).toMatchObject({ aba: 'redescobrir', secao: 'paradas', recente: false, vezesTocada: 1, vezesEm6Meses: 0, temLetra: true })
    expect(porId.sublime).toMatchObject({ aba: 'redescobrir', secao: 'nunca', recente: false, vezesTocada: 0, temLetra: false })
  })

  it('diz em quais Escalas agendadas a Música já está, e exclui a Escala pedida', async () => {
    await criarItemInteira('ifuturo', 'e1', 'rio', 'D')

    const comTudo = await listar('')
    expect(comTudo.find((m) => m.id === 'rio')?.planejadaEm).toEqual([
      { escalaId: 'e1', data: FUTURO, titulo: 'Culto de Domingo 18h', ministros: ['Marcos'] },
    ])
    expect(comTudo.find((m) => m.id === 'dono')?.planejadaEm).toEqual([])

    expect((await listar('?escalaId=e1')).find((m) => m.id === 'rio')?.planejadaEm).toEqual([])
    expect((await pedir('/api/musicas?escalaId=nada', 'marcos')).status).toBe(404)
  })

  it('esconde as arquivadas, e mostra quando pedem', async () => {
    await env.DB.prepare('update musicas set arquivada = 1 where id = ?').bind('sublime').run()

    expect((await listar('')).map((m) => m.id)).toEqual(['dono', 'rio'])
    expect((await listar('?arquivadas=1')).map((m) => m.id)).toEqual(['dono', 'rio', 'sublime'])
  })

  it('marca Legado quem veio da playlist e nunca foi tocada', async () => {
    const musicas = await listar('')

    expect(musicas.find((m) => m.id === 'sublime')?.legado).toBe(true)
    expect(musicas.find((m) => m.id === 'rio')?.legado).toBe(false)
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

  it('os parâmetros antigos de filtro e ordem são ignorados: a lista é uma só', async () => {
    expect((await listar('?filtro=legado&meses=12&ordem=menos-tempo')).map((m) => m.id)).toEqual(['dono', 'rio', 'sublime'])
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
    expect((await listar('?arquivadas=1')).map((m) => m.id)).toEqual(['dono', 'rio'])
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
    expect((await listar('')).map((m) => m.id)).toEqual(['dono', 'rio', 'sublime'])
  })

  it('recusa Membro comum', async () => {
    expect((await pedir('/api/musicas/sublime', 'julia', { method: 'DELETE' })).status).toBe(403)
  })
})

describe('memória no detalhe da Música', () => {
  it('traz recente, planejada, vezes, letra e a cobertura do ministério inteiro', async () => {
    await criarItemInteira('ifuturo', 'e1', 'rio', 'D')

    const resposta = await pedir('/api/musicas/rio?escalaId=e1', 'julia')
    const corpo = await resposta.json<{
      recente: boolean
      planejadaEm: unknown[]
      vezesTocada: number
      vezesEm6Meses: number
      temLetra: boolean
      cobertura: { ja: string[]; nunca: string[] } | null
      coberturaDoMinisterio: { ja: string[]; nunca: string[] }
    }>()

    expect(corpo).toMatchObject({ recente: false, planejadaEm: [], vezesTocada: 1, vezesEm6Meses: 0, temLetra: false })
    expect(corpo.cobertura).toEqual({ ja: ['Marcos'], nunca: ['Júlia'] })
    expect(corpo.coberturaDoMinisterio).toEqual({ ja: ['Gabriel', 'Marcos'], nunca: ['Júlia'] })

    const semEscala = await (await pedir('/api/musicas/rio', 'julia')).json<{ planejadaEm: { escalaId: string }[] }>()
    expect(semEscala.planejadaEm.map((p) => p.escalaId)).toEqual(['e1'])
  })
})
