import { env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { base64urlParaBytes } from '../../src/push/base64'
import { gravarConfiguracao } from '../dados/acesso'
import { enfileirar, vencidas } from '../dados/notificacoes'
import { definirSilenciado, guardarInscricao, inscricoesDe } from '../dados/push'
import { fingirPush } from '../testes/rede'
import { criarEscala, criarFuncao, criarMembro, limparBanco, porNaEquipe } from '../testes/apoio'
import { parDeChaves, segredosDoRegistro } from './cifra'
import { CHAVE_DA_ORIGEM, despachar, rodarNotificacoes } from './despacho'
import { importarPublica } from './vapid'

const AGORA = new Date('2026-09-05T15:00:00.000Z')

const APARELHO = {
  endpoint: 'https://web.push.apple.com/aparelho-da-julia',
  p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
}
const PRIVADA_DO_APARELHO = 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94'

const aviso = { titulo: 'Você foi escalado', corpo: 'Você está na Escala de dom, 13 de set, 18h', url: '/escalas/e0913' }

afterEach(() => vi.unstubAllGlobals())

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await gravarConfiguracao(env.DB, CHAVE_DA_ORIGEM, 'https://hub.renovo.test')
})

describe('despachar', () => {
  it('envia o que venceu, com VAPID e corpo aes128gcm que o aparelho abre', async () => {
    await guardarInscricao(env.DB, 'julia', APARELHO)
    await enfileirar(env.DB, umaNotificacao('julia'), AGORA)

    const rede = fingirPush(() => 201)
    const resultado = await despachar(env, AGORA)

    expect(resultado).toMatchObject({ enviadas: 1, aparelhos: 1 })
    expect(rede.pedidos).toHaveLength(1)

    const pedido = rede.pedidos[0]
    expect(pedido.url).toBe(APARELHO.endpoint)
    expect(pedido.headers.get('content-encoding')).toBe('aes128gcm')
    expect(pedido.headers.get('ttl')).toBe('86400')
    expect(await jwtValido(pedido.headers.get('authorization')!)).toBe(true)

    expect(JSON.parse(await abrir(pedido))).toEqual({
      web_push: 8030,
      notification: {
        title: aviso.titulo,
        body: aviso.corpo,
        navigate: 'https://hub.renovo.test/escalas/e0913',
        lang: 'pt-BR',
      },
    })
  })

  it('não envia o que ainda não venceu', async () => {
    await guardarInscricao(env.DB, 'julia', APARELHO)
    await enfileirar(
      env.DB,
      { ...umaNotificacao('julia'), enviarApos: new Date(AGORA.getTime() + 3600_000).toISOString() },
      AGORA,
    )

    const rede = fingirPush(() => 201)
    await despachar(env, AGORA)

    expect(rede.pedidos).toHaveLength(0)
  })

  it('respeita quem silenciou, sem apagar a inscrição', async () => {
    await guardarInscricao(env.DB, 'julia', APARELHO)
    await definirSilenciado(env.DB, 'julia', true)
    await enfileirar(env.DB, umaNotificacao('julia'), AGORA)

    const rede = fingirPush(() => 201)
    const resultado = await despachar(env, AGORA)

    expect(rede.pedidos).toHaveLength(0)
    expect(resultado.silenciadas).toBe(1)
    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(1)
    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })

  it('apaga a inscrição que devolve 404 ou 410', async () => {
    await guardarInscricao(env.DB, 'julia', APARELHO)
    await guardarInscricao(env.DB, 'marcos', { ...APARELHO, endpoint: 'https://web.push.apple.com/outro' })
    await enfileirar(env.DB, umaNotificacao('julia'), AGORA)
    await enfileirar(env.DB, umaNotificacao('marcos'), AGORA)

    fingirPush((url) => (url.endsWith('outro') ? 410 : 404))
    await despachar(env, AGORA)

    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(0)
    expect(await inscricoesDe(env.DB, 'marcos')).toHaveLength(0)
  })

  it('não deixa a fila entupir quando o Membro não tem aparelho', async () => {
    await enfileirar(env.DB, umaNotificacao('julia'), AGORA)

    const rede = fingirPush(() => 201)
    const resultado = await despachar(env, AGORA)

    expect(rede.pedidos).toHaveLength(0)
    expect(resultado.descartadas).toBe(1)
    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })

  it('marca como enviada mesmo se o serviço de push cair', async () => {
    await guardarInscricao(env.DB, 'julia', APARELHO)
    await enfileirar(env.DB, umaNotificacao('julia'), AGORA)

    fingirPush(() => 500)
    const resultado = await despachar(env, AGORA)

    expect(resultado.enviadas).toBe(0)
    expect(await inscricoesDe(env.DB, 'julia')).toHaveLength(1)
    expect(await vencidas(env.DB, AGORA)).toHaveLength(0)
  })
})

describe('rodarNotificacoes', () => {
  it('gera o lembrete da véspera e já despacha', async () => {
    await criarEscala({ id: 'e0913', data: '2099-09-13' })
    await porNaEquipe('e0913', 'julia', ['vocal'])
    await guardarInscricao(env.DB, 'julia', APARELHO)

    const rede = fingirPush(() => 201)
    const resultado = await rodarNotificacoes(env, new Date('2099-09-12T13:00:00.000Z'))

    expect(resultado.enviadas).toBe(1)
    expect(JSON.parse(await abrir(rede.pedidos[0])).notification.title).toBe('Amanhã tem Escala')
  })
})

function umaNotificacao(membroId: string) {
  return { membroId, tipo: 'escalado' as const, escalaId: null, aviso, enviarApos: AGORA.toISOString() }
}

async function jwtValido(autorizacao: string): Promise<boolean> {
  const [, jwt, publica] = autorizacao.match(/^vapid t=([^,]+), k=(.+)$/) ?? []
  const [cabecalho, corpo, assinatura] = jwt.split('.')

  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    await importarPublica(publica),
    base64urlParaBytes(assinatura),
    new TextEncoder().encode(`${cabecalho}.${corpo}`),
  )
}

async function abrir(pedido: Request): Promise<string> {
  const corpo = new Uint8Array(await pedido.arrayBuffer())
  const salt = corpo.slice(0, 16)
  const asPublica = corpo.slice(21, 21 + corpo[20])
  const cifra = corpo.slice(21 + corpo[20])

  const doAparelho = await parDeChaves(PRIVADA_DO_APARELHO, APARELHO.p256dh)

  const { cek, nonce } = await segredosDoRegistro({
    privada: doAparelho.privada,
    publicaDoOutro: asPublica,
    uaPublica: doAparelho.publica,
    asPublica,
    auth: base64urlParaBytes(APARELHO.auth),
    salt,
  })

  const chave = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt'])
  const aberto = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, chave, cifra),
  )

  return new TextDecoder().decode(aberto.slice(0, -1))
}
