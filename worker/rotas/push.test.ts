import { SELF, env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { vencidas } from '../dados/notificacoes'
import { definirSilenciado, inscricoesDe } from '../dados/push'
import { fingirPush } from '../testes/rede'
import { cookieDe, criarFuncao, criarMembro, limparBanco } from '../testes/apoio'

const RAIZ = 'http://local.test'

const INSCRICAO = {
  endpoint: 'https://web.push.apple.com/aparelho-da-julia',
  p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
}

afterEach(() => vi.unstubAllGlobals())

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
})

describe('GET /api/push/chave', () => {
  it('devolve a chave pública VAPID pro navegador', async () => {
    const { chave } = await corpoDe<{ chave: string }>(await pedir('/api/push/chave', 'julia'))

    expect(chave).toBe(env.VAPID_PUBLIC)
  })

  it('exige sessão', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/push/chave`)).status).toBe(401)
  })
})

describe('POST /api/push/inscrever', () => {
  it('guarda a inscrição do Membro da sessão', async () => {
    const resposta = await pedir('/api/push/inscrever', 'julia', INSCRICAO)

    expect(resposta.status).toBe(201)
    expect(await inscricoesDe(env.DB, 'julia')).toMatchObject([{ endpoint: INSCRICAO.endpoint }])
  })

  it('não duplica quando o mesmo aparelho reenvia a inscrição', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)
    await pedir('/api/push/inscrever', 'julia', { ...INSCRICAO, auth: 'OUTRAauthOUTRAauth1234' })

    const inscricoes = await inscricoesDe(env.DB, 'julia')
    expect(inscricoes).toHaveLength(1)
    expect(inscricoes[0].auth).toBe('OUTRAauthOUTRAauth1234')
  })

  it('passa o aparelho pro Membro novo quando outro entra no mesmo celular', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)
    await pedir('/api/push/inscrever', 'marcos', INSCRICAO)

    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(0)
    expect(await inscricoesDe(env.DB, 'marcos')).toHaveLength(1)
  })

  it('recusa inscrição sem endereço ou sem chaves', async () => {
    const resposta = await pedir('/api/push/inscrever', 'julia', { endpoint: INSCRICAO.endpoint })

    expect(resposta.status).toBe(422)
    expect(await corpoDe<{ erro: string }>(resposta)).toEqual({ erro: 'Envie o endereço e as chaves da inscrição.' })
  })
})

describe('POST /api/push/desinscrever', () => {
  it('apaga a inscrição daquele aparelho', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)
    const resposta = await pedir('/api/push/desinscrever', 'julia', { endpoint: INSCRICAO.endpoint })

    expect(resposta.status).toBe(200)
    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(0)
  })
})

describe('POST /api/push/silenciar', () => {
  it('liga e desliga o silêncio sem mexer na inscrição', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)

    expect(await corpoDe(await pedir('/api/push/silenciar', 'julia', { silenciado: true }))).toEqual({
      silenciado: true,
    })
    expect(await eu('julia')).toMatchObject({ silenciado: true })
    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(1)

    await pedir('/api/push/silenciar', 'julia', { silenciado: false })
    expect(await eu('julia')).toMatchObject({ silenciado: false })
  })

  it('recusa valor que não é sim ou não', async () => {
    expect((await pedir('/api/push/silenciar', 'julia', { silenciado: 'talvez' })).status).toBe(422)
  })
})

describe('POST /api/push/teste', () => {
  it('manda o push de teste pro aparelho de quem pediu', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)

    const rede = fingirPush(() => 201)
    const resposta = await pedir('/api/push/teste', 'julia', {})

    expect(resposta.status).toBe(200)
    expect(await corpoDe(resposta)).toEqual({ aparelhos: 1, silenciado: false })
    expect(rede.pedidos).toHaveLength(1)
    expect(rede.pedidos[0].url).toBe(INSCRICAO.endpoint)
    expect(await vencidas(env.DB, new Date())).toHaveLength(0)
  })

  it('avisa quando o aparelho ainda não está inscrito', async () => {
    const resposta = await pedir('/api/push/teste', 'julia', {})

    expect(resposta.status).toBe(409)
    expect(await corpoDe<{ erro: string }>(resposta)).toEqual({
      erro: 'Este aparelho ainda não está inscrito. Ative as notificações primeiro.',
    })
  })

  it('não incomoda quem silenciou', async () => {
    await pedir('/api/push/inscrever', 'julia', INSCRICAO)
    await definirSilenciado(env.DB, 'julia', true)

    const rede = fingirPush(() => 201)
    const resposta = await pedir('/api/push/teste', 'julia', {})

    expect(await corpoDe(resposta)).toEqual({ aparelhos: 0, silenciado: true })
    expect(rede.pedidos).toHaveLength(0)
  })
})

async function pedir(caminho: string, quem: string, corpo?: unknown): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { cookie: await cookieDe(quem), 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
}

async function eu(quem: string): Promise<unknown> {
  return corpoDe(await SELF.fetch(`${RAIZ}/api/eu`, { headers: { cookie: await cookieDe(quem) } }))
}

async function corpoDe<T = unknown>(resposta: Response): Promise<T> {
  return resposta.json<T>()
}
