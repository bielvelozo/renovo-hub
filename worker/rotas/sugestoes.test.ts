import { SELF, env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { limparCacheDeVideos } from '../dados/oembed'
import {
  apoiarNoBanco,
  cookieDe,
  criarEscala,
  criarFuncao,
  criarMembro,
  criarMusica,
  criarSugestao,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'
import { fingirRede } from '../testes/rede'

const RAIZ = 'http://local.test'
const FUTURO = '2099-08-16'
const PASSADO = '2020-08-16'

type SugestaoJson = {
  id: string
  membro: { id: string; nome: string }
  musica: { id: string; titulo: string; capa: string } | null
  link: string | null
  titulo: string
  observacao: string
  data: string
  promovidaEm: string | null
  apoios: { id: string; nome: string }[]
  apoiei: boolean
}

beforeEach(async () => {
  limparCacheDeVideos()
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1)
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'ana', nome: 'Ana', funcoes: ['vocal'] })
  await criarEscala({ id: 'e1', data: FUTURO })
  await porNaEquipe('e1', 'marcos', ['vocal'], true)
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function pedir(caminho: string, quem: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: await cookieDe(quem), ...(init.headers ?? {}) },
  })
}

async function sugerir(corpo: unknown, quem = 'julia'): Promise<Response> {
  return pedir('/api/sugestoes', quem, { method: 'POST', body: JSON.stringify(corpo) })
}

async function listar(quem = 'julia', consulta = ''): Promise<SugestaoJson[]> {
  const resposta = await pedir('/api/sugestoes' + consulta, quem)
  const { sugestoes } = await resposta.json<{ sugestoes: SugestaoJson[] }>()
  return sugestoes
}

describe('criar Sugestão', () => {
  it('aceita uma Música do catálogo, com observação, e o Membro comum pode', async () => {
    const resposta = await sugerir({ musicaId: 'rio', observacao: 'pra abrir o culto' })

    expect(resposta.status).toBe(201)
    const sugestao = await resposta.json<SugestaoJson>()

    expect(sugestao.membro).toEqual({ id: 'julia', nome: 'Júlia' })
    expect(sugestao.musica).toMatchObject({ id: 'rio', titulo: 'Rio' })
    expect(sugestao.titulo).toBe('Rio')
    expect(sugestao.observacao).toBe('pra abrir o culto')
    expect(sugestao.promovidaEm).toBeNull()
  })

  it('conta quem sugeriu como o primeiro apoio', async () => {
    const resposta = await sugerir({ musicaId: 'rio' })
    const sugestao = await resposta.json<SugestaoJson>()

    expect(sugestao.apoios).toEqual([{ id: 'julia', nome: 'Júlia' }])
    expect(sugestao.apoiei).toBe(true)
  })

  it('aceita link com título quando o vídeo não está no catálogo', async () => {
    const resposta = await sugerir({ link: 'https://youtu.be/hRJUcvsnqKs', titulo: 'Meia Noite' })

    expect(resposta.status).toBe(201)
    const sugestao = await resposta.json<SugestaoJson>()

    expect(sugestao.musica).toBeNull()
    expect(sugestao.link).toBe('https://youtu.be/hRJUcvsnqKs')
    expect(sugestao.titulo).toBe('Meia Noite')
  })

  it('liga o link à Música do catálogo quando o vídeo já existe', async () => {
    const resposta = await sugerir({ link: 'https://youtu.be/s1oU-6vYc4E', titulo: 'Outro nome' })
    const sugestao = await resposta.json<SugestaoJson>()

    expect(sugestao.musica).toMatchObject({ id: 'rio', titulo: 'Rio' })
  })

  it('recusa sem Música e sem link', async () => {
    const resposta = await sugerir({ observacao: 'aquela música' })

    expect(resposta.status).toBe(422)
    expect(await resposta.json()).toMatchObject({ erro: expect.stringContaining('link') })
  })

  it('recusa link fora do YouTube', async () => {
    const resposta = await sugerir({ link: 'https://exemplo.com/musica', titulo: 'Nada' })

    expect(resposta.status).toBe(422)
  })

  it('recusa link sem título', async () => {
    const resposta = await sugerir({ link: 'https://youtu.be/hRJUcvsnqKs' })

    expect(resposta.status).toBe(422)
  })

  it('recusa Música desconhecida e Música arquivada', async () => {
    expect((await sugerir({ musicaId: 'inexistente' })).status).toBe(422)

    await env.DB.prepare('update musicas set arquivada = 1 where id = ?').bind('rio').run()
    expect((await sugerir({ musicaId: 'rio' })).status).toBe(422)
  })

  it('sem cookie devolve 401', async () => {
    const resposta = await SELF.fetch(`${RAIZ}/api/sugestoes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ musicaId: 'rio' }),
    })

    expect(resposta.status).toBe(401)
  })
})

describe('listar Sugestões', () => {
  it('sai da mais nova pra mais velha, com apoios e data', async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio', data: '2026-09-01T10:00:00.000Z' })
    await criarSugestao({ id: 's2', membroId: 'ana', link: 'https://youtu.be/x', titulo: 'Nova', data: '2026-09-03T10:00:00.000Z' })
    await apoiarNoBanco('s1', 'julia')
    await apoiarNoBanco('s1', 'ana')

    const sugestoes = await listar()

    expect(sugestoes.map((s) => s.id)).toEqual(['s2', 's1'])
    expect(sugestoes[1].apoios.map((a) => a.nome)).toEqual(['Ana', 'Júlia'])
    expect(sugestoes[1].data).toBe('2026-09-01T10:00:00.000Z')
  })

  it('esconde as promovidas, e mostra com promovidas=1', async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio' })
    await env.DB.prepare('update sugestoes set promovida_em = ? where id = ?').bind('2026-09-04T10:00:00.000Z', 's1').run()

    expect(await listar()).toHaveLength(0)

    const todas = await listar('julia', '?promovidas=1')
    expect(todas).toHaveLength(1)
    expect(todas[0].promovidaEm).toBe('2026-09-04T10:00:00.000Z')
  })

  it('marca apoiei pra quem pede', async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio' })
    await apoiarNoBanco('s1', 'ana')

    expect((await listar('ana'))[0].apoiei).toBe(true)
    expect((await listar('julia'))[0].apoiei).toBe(false)
  })
})

describe('apoiar e desapoiar', () => {
  beforeEach(async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio' })
    await apoiarNoBanco('s1', 'julia')
  })

  it('apoiar duas vezes não duplica', async () => {
    await pedir('/api/sugestoes/s1/apoiar', 'ana', { method: 'POST' })
    const resposta = await pedir('/api/sugestoes/s1/apoiar', 'ana', { method: 'POST' })

    expect(resposta.status).toBe(200)
    const sugestao = await resposta.json<SugestaoJson>()

    expect(sugestao.apoios.map((a) => a.id).sort()).toEqual(['ana', 'julia'])
    expect(sugestao.apoiei).toBe(true)
  })

  it('desapoiar tira só o apoio de quem pediu', async () => {
    await pedir('/api/sugestoes/s1/apoiar', 'ana', { method: 'POST' })
    const resposta = await pedir('/api/sugestoes/s1/apoiar', 'ana', { method: 'DELETE' })

    const sugestao = await resposta.json<SugestaoJson>()
    expect(sugestao.apoios.map((a) => a.id)).toEqual(['julia'])
    expect(sugestao.apoiei).toBe(false)
  })

  it('desapoiar sem ter apoiado não quebra', async () => {
    const resposta = await pedir('/api/sugestoes/s1/apoiar', 'ana', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
  })

  it('Sugestão desconhecida devolve 404', async () => {
    const resposta = await pedir('/api/sugestoes/nada/apoiar', 'ana', { method: 'POST' })

    expect(resposta.status).toBe(404)
  })
})

describe('apagar Sugestão', () => {
  beforeEach(async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio' })
  })

  it('o dono apaga a própria', async () => {
    const resposta = await pedir('/api/sugestoes/s1', 'julia', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
    expect(await listar()).toHaveLength(0)
  })

  it('o Admin apaga a de qualquer um', async () => {
    const resposta = await pedir('/api/sugestoes/s1', 'gabriel', { method: 'DELETE' })

    expect(resposta.status).toBe(200)
  })

  it('outro Membro, nem Ministro, não apaga a alheia', async () => {
    expect((await pedir('/api/sugestoes/s1', 'ana', { method: 'DELETE' })).status).toBe(403)
    expect((await pedir('/api/sugestoes/s1', 'marcos', { method: 'DELETE' })).status).toBe(403)
    expect(await listar()).toHaveLength(1)
  })
})

describe('promover Sugestão', () => {
  type Promovida = {
    escala: { itens: { tipo: string; tom?: string; musica?: { id: string }; descricao: string }[] }
    sugestao: SugestaoJson
  }

  beforeEach(async () => {
    await criarSugestao({ id: 's1', membroId: 'julia', musicaId: 'rio' })
    await apoiarNoBanco('s1', 'julia')
  })

  async function promover(corpo: unknown, quem = 'marcos', id = 's1'): Promise<Response> {
    return pedir(`/api/sugestoes/${id}/promover`, quem, { method: 'POST', body: JSON.stringify(corpo) })
  }

  it('cria o Item na Escala, tira da lista e guarda a origem', async () => {
    const resposta = await promover({ escalaId: 'e1', tom: 'D' })

    expect(resposta.status).toBe(201)
    const { escala, sugestao } = await resposta.json<Promovida>()

    expect(escala.itens).toHaveLength(1)
    expect(escala.itens[0]).toMatchObject({ tipo: 'inteira', tom: 'D', descricao: 'Rio · Tom D' })
    expect(escala.itens[0].musica).toMatchObject({ id: 'rio' })
    expect(sugestao.promovidaEm).not.toBeNull()

    expect(await listar()).toHaveLength(0)

    const item = await env.DB.prepare('select origem_sugestao_id, ministrado_por from itens').first<{
      origem_sugestao_id: string
      ministrado_por: string
    }>()
    expect(item?.origem_sugestao_id).toBe('s1')
    expect(item?.ministrado_por).toBe('marcos')
  })

  it('aceita virar Trecho com minutagem', async () => {
    const resposta = await promover({ escalaId: 'e1', tipo: 'trecho', tom: 'G', inicio: '1:05', fim: '2:30' })

    expect(resposta.status).toBe(201)
    const { escala } = await resposta.json<Promovida>()
    expect(escala.itens[0]).toMatchObject({ tipo: 'trecho', tom: 'G' })
  })

  it('cria a Música do catálogo quando a Sugestão veio só de link', async () => {
    const rede = fingirRede({
      'youtube.com/oembed': { status: 200, corpo: { title: 'Meia Noite', author_name: 'Fhop Music' } },
    })
    await criarSugestao({ id: 's2', membroId: 'ana', link: 'https://youtu.be/hRJUcvsnqKs', titulo: 'Meia Noite' })

    const resposta = await promover({ escalaId: 'e1', tom: 'A' }, 'marcos', 's2')

    expect(resposta.status).toBe(201)
    expect(rede.chamadas).toHaveLength(1)

    const musica = await env.DB.prepare('select id, titulo, legado from musicas where video_id = ?')
      .bind('hRJUcvsnqKs')
      .first<{ id: string; titulo: string; legado: number }>()
    expect(musica?.titulo).toBe('Meia Noite')
    expect(musica?.legado).toBe(0)

    const { sugestao } = await resposta.json<Promovida>()
    expect(sugestao.musica?.id).toBe(musica?.id)
  })

  it('recusa Escala que não é Agendada', async () => {
    await criarEscala({ id: 'e2', data: PASSADO })
    await criarEscala({ id: 'e3', data: FUTURO, cancelada: true })

    expect((await promover({ escalaId: 'e2', tom: 'D' })).status).toBe(422)
    expect((await promover({ escalaId: 'e3', tom: 'D' })).status).toBe(422)
  })

  it('recusa promover duas vezes', async () => {
    await promover({ escalaId: 'e1', tom: 'D' })
    const resposta = await promover({ escalaId: 'e1', tom: 'D' })

    expect(resposta.status).toBe(409)
  })

  it('recusa Medley e Tom vazio', async () => {
    expect((await promover({ escalaId: 'e1', tipo: 'medley', tom: 'D' })).status).toBe(422)
    expect((await promover({ escalaId: 'e1', tom: '  ' })).status).toBe(422)
  })

  it('Escala desconhecida devolve 404 e Membro comum 403', async () => {
    expect((await promover({ escalaId: 'nada', tom: 'D' })).status).toBe(404)
    expect((await promover({ escalaId: 'e1', tom: 'D' }, 'julia')).status).toBe(403)
  })
})
