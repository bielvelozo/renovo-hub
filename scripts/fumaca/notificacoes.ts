import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { webcrypto } from 'node:crypto'
import { consultar, esperar } from './ambiente'
import { exigir, ultimoItem } from './cenario'
import type { Cenario } from './cenario'
import { RAIZ } from './prova'
import type { Prova } from './prova'

const PORTA_DO_SERVICO = 9099
const ENDPOINT_VIVO = `http://127.0.0.1:${PORTA_DO_SERVICO}/aparelho-do-gabriel`
const ENDPOINT_MORTO = `http://127.0.0.1:${PORTA_DO_SERVICO}/aparelho-trocado`
const ENDPOINT_DA_ISA = `http://127.0.0.1:${PORTA_DO_SERVICO}/aparelho-da-isa`
const VIDEO_DA_MUDANCA = 'IxpWNuxGmzc'

type Bytes = Uint8Array<ArrayBuffer>

type Recebido = { url: string; cabecalhos: Record<string, string | undefined>; corpo: Bytes }

export async function fluxosDeNotificacao(prova: Prova, cenario: Cenario): Promise<void> {
  const raiz = cenario.raiz
  prova.grupo('Notificações · Web Push')

  const chave = await prova.api('/api/push/chave', { cookie: cenario.gabriel })

  if (!chave.corpo?.chave) {
    throw new Error(
      'As chaves VAPID não estão neste servidor. Rode `npm run vapid` e ponha VAPID_PUBLIC, VAPID_PRIVATE e VAPID_SUBJECT no .dev.vars antes do smoke.',
    )
  }

  prova.conferir('o Worker anuncia a chave pública de VAPID', chave.corpo.chave.length > 80)

  const recebidos: Recebido[] = []
  const servico = await servicoFalsoDePush(recebidos)

  try {
    const aparelho = await gerarAparelho()

    // O despacho manda a fila inteira, então a fila precisa estar vazia pra o teste contar só o próprio push.
    limparFila(raiz)

    exigir(
      await prova.api('/api/push/inscrever', {
        cookie: cenario.gabriel,
        corpo: { endpoint: ENDPOINT_VIVO, p256dh: aparelho.p256dh, auth: aparelho.auth },
      }),
      201,
      'inscrever o aparelho',
    )

    const teste = exigir(await prova.api('/api/push/teste', { metodo: 'POST', cookie: cenario.gabriel }), 200, 'push de teste')
    await esperar(500)

    prova.conferir('o push de teste sai para o aparelho inscrito', teste.aparelhos === 1, `${teste.aparelhos} aparelho`)

    const pedido = recebidos.at(-1)!
    prova.conferir(
      'o corpo vai cifrado em aes128gcm com TTL',
      pedido.cabecalhos['content-encoding'] === 'aes128gcm' && !!pedido.cabecalhos['ttl'],
      `content-encoding: ${pedido.cabecalhos['content-encoding']} · ttl: ${pedido.cabecalhos['ttl']}`,
    )

    const autorizacao = String(pedido.cabecalhos['authorization'])
    prova.conferir('o cabeçalho de autorização é VAPID', autorizacao.startsWith('vapid t='))
    prova.conferir('o JWT é válido com a chave pública anunciada', await jwtConfere(autorizacao))

    const carga = JSON.parse(await decifrar(pedido.corpo, aparelho))
    prova.conferir(
      'a carga chega legível no aparelho, no formato Declarative Web Push',
      carga.web_push === 8030 && !!carga.notification?.title,
      `${carga.notification?.title} — ${carga.notification?.body}`,
    )
    prova.conferir('a notificação aponta para uma URL absoluta', String(carga.notification?.navigate).startsWith('http'))

    exigir(
      await prova.api('/api/push/inscrever', {
        cookie: cenario.gabriel,
        corpo: { endpoint: ENDPOINT_MORTO, p256dh: aparelho.p256dh, auth: aparelho.auth },
      }),
      201,
      'inscrever o aparelho trocado',
    )
    await prova.api('/api/push/teste', { metodo: 'POST', cookie: cenario.gabriel })
    await esperar(500)

    const inscricoes = Number(consultar(raiz, 'select count(*) as n from push_inscricoes')[0]?.n ?? -1)
    prova.conferir('a inscrição que devolve 410 é apagada sozinha', inscricoes === 1, `${inscricoes} inscrição`)

    exigir(
      await prova.api('/api/push/silenciar', { cookie: cenario.gabriel, corpo: { silenciado: true } }),
      200,
      'silenciar',
    )
    const silenciado = exigir(await prova.api('/api/push/teste', { metodo: 'POST', cookie: cenario.gabriel }), 200, 'push silenciado')
    prova.conferir(
      'silenciar segura o push e mantém a inscrição',
      silenciado.aparelhos === 0 && silenciado.silenciado === true,
      `${consultar(raiz, 'select count(*) as n from push_inscricoes')[0]?.n} inscrição de pé`,
    )
    exigir(
      await prova.api('/api/push/silenciar', { cookie: cenario.gabriel, corpo: { silenciado: false } }),
      200,
      'tirar o silêncio',
    )

    prova.grupo('Notificações · Fila e cron')

    limparFila(raiz)

    const aparelhoDaIsa = await gerarAparelho()
    exigir(
      await prova.api('/api/push/inscrever', {
        cookie: cenario.isa,
        corpo: { endpoint: ENDPOINT_DA_ISA, p256dh: aparelhoDaIsa.p256dh, auth: aparelhoDaIsa.auth },
      }),
      201,
      'inscrever o aparelho da Isa',
    )

    exigir(
      await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/bia`, {
        metodo: 'PUT',
        cookie: cenario.gabriel,
        corpo: { funcoes: ['backing'] },
      }),
      200,
      'escalar a Bia',
    )

    const escalado = consultar(raiz, "select membro_id, corpo from notificacoes where tipo = 'escalado'")
    prova.conferir(
      'escalar alguém numa Agendada enfileira o aviso',
      escalado.length === 1 && escalado[0].membro_id === 'bia',
      String(escalado[0]?.corpo),
    )

    limparFila(raiz)
    const realizada = await prova.api(`/api/escalas?mes=2026-08`, { cookie: cenario.gabriel })
    const passada = realizada.corpo.escalas.find((e: any) => e.data === '2026-08-30')

    exigir(
      await prova.api(`/api/escalas/${passada.id}/equipe/rafa`, {
        metodo: 'PUT',
        cookie: cenario.gabriel,
        corpo: { funcoes: ['teclado'] },
      }),
      200,
      'editar a Escala Realizada',
    )
    const filaDepois = consultar(raiz, 'select count(*) as n from notificacoes')
    prova.conferir('editar Escala Realizada é silencioso', Number(filaDepois[0].n) === 0, `${filaDepois[0].n} na fila`)

    limparFila(raiz)
    const novoItem = await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
      cookie: cenario.gabriel,
      corpo: { tipo: 'inteira', musicaId: cenario.musicas.get(VIDEO_DA_MUDANCA), tom: 'G' },
    })

    const primeiraLeva = consultar(raiz, "select membro_id, mudancas, corpo from notificacoes where tipo = 'musica'")
    prova.conferir(
      'a mudança de Repertório avisa a Equipe, menos quem fez',
      primeiraLeva.length > 0 && !primeiraLeva.some((linha) => linha.membro_id === 'gabriel'),
      `${primeiraLeva.length} avisos · ${String(primeiraLeva[0]?.corpo)}`,
    )

    const item = ultimoItem(novoItem.corpo)
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens/${item.id}`, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { tom: 'A' },
    })

    const segundaLeva = consultar(raiz, "select membro_id, mudancas, corpo from notificacoes where tipo = 'musica'")
    prova.conferir(
      'a segunda mudança engorda o mesmo aviso em vez de mandar outro',
      segundaLeva.length === primeiraLeva.length && segundaLeva.every((linha) => Number(linha.mudancas) === 2),
      String(segundaLeva[0]?.corpo),
    )

    exigir(
      await prova.api(`/api/escalas/${cenario.escalaDoMes}/cancelar`, { metodo: 'POST', cookie: cenario.gabriel }),
      200,
      'cancelar a Escala montada',
    )
    const canceladas = consultar(raiz, "select membro_id, corpo from notificacoes where tipo = 'cancelada'")
    prova.conferir(
      'cancelar avisa a Equipe inteira',
      canceladas.length === primeiraLeva.length + 1,
      `${canceladas.length} avisos · ${String(canceladas[0]?.corpo)}`,
    )

    exigir(
      await prova.api(`/api/escalas/${cenario.escalaDoMes}/desfazer`, { metodo: 'POST', cookie: cenario.gabriel }),
      200,
      'desfazer o cancelamento',
    )
    prova.conferir(
      'desfazer o cancelamento não enfileira nada novo',
      consultar(raiz, "select count(*) as n from notificacoes where tipo = 'cancelada'")[0].n === canceladas.length,
    )

    const antesDoCron = recebidos.filter((pedido) => pedido.url.includes('aparelho-da-isa')).length
    const cron = await fetch(`${RAIZ}/__scheduled?cron=*/15+*+*+*+*`)
    await esperar(800)

    prova.conferir('o gatilho de cron responde', cron.status === 200, String(cron.status))

    const pendentes = consultar(raiz, 'select count(*) as n from notificacoes where enviada_em is null')
    prova.conferir('o cron esvazia a fila do que já venceu', Number(pendentes[0].n) === 0, `${pendentes[0].n} pendentes`)
    const entregues = recebidos.filter((pedido) => pedido.url.includes('aparelho-da-isa')).length
    prova.conferir(
      'o cron entrega o push no aparelho de quem foi avisado',
      entregues > antesDoCron,
      `${entregues - antesDoCron} entregues`,
    )

    const paraIsa = recebidos.filter((pedido) => pedido.url.includes('aparelho-da-isa'))
    const doCron = JSON.parse(await decifrar(paraIsa.at(-1)!.corpo, aparelhoDaIsa))
    prova.conferir(
      'o push do cron chega legível e aponta pra Escala',
      !!doCron.notification?.title && String(doCron.notification?.navigate).includes('/escalas/'),
      `${doCron.notification?.title} — ${doCron.notification?.body}`,
    )

    await prova.api('/api/push/desinscrever', { cookie: cenario.gabriel, corpo: { endpoint: ENDPOINT_VIVO } })
    await prova.api('/api/push/desinscrever', { cookie: cenario.isa, corpo: { endpoint: ENDPOINT_DA_ISA } })
  } finally {
    await new Promise<void>((pronto) => servico.close(() => pronto()))
  }
}

function limparFila(raiz: string): void {
  consultar(raiz, 'delete from notificacoes')
}

function servicoFalsoDePush(recebidos: Recebido[]): Promise<Server> {
  const servidor = createServer((requisicao, resposta) => {
    const pedacos: Buffer[] = []

    requisicao.on('data', (pedaco) => pedacos.push(pedaco as Buffer))
    requisicao.on('end', () => {
      recebidos.push({
        url: requisicao.url ?? '',
        cabecalhos: requisicao.headers as Record<string, string | undefined>,
        corpo: new Uint8Array(Buffer.concat(pedacos)),
      })
      resposta.writeHead(requisicao.url?.includes('trocado') ? 410 : 201).end()
    })
  })

  return new Promise((pronto) => servidor.listen(PORTA_DO_SERVICO, '127.0.0.1', () => pronto(servidor)))
}

type Aparelho = { publica: Bytes; privada: CryptoKey; segredo: Bytes; p256dh: string; auth: string }

async function gerarAparelho(): Promise<Aparelho> {
  const par = await webcrypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const publica = new Uint8Array(await webcrypto.subtle.exportKey('raw', par.publicKey))
  const segredo = webcrypto.getRandomValues(new Uint8Array(16))

  return { publica, privada: par.privateKey, segredo, p256dh: base64Url(publica), auth: base64Url(segredo) }
}

async function jwtConfere(autorizacao: string): Promise<boolean> {
  const jwt = autorizacao.match(/t=([^,]+)/)?.[1]
  const anunciada = autorizacao.match(/k=(.+)$/)?.[1]
  if (!jwt || !anunciada) return false

  const [cabecalho, conteudo, assinatura] = jwt.split('.')
  const chave = await webcrypto.subtle.importKey(
    'raw',
    deBase64Url(anunciada),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )

  return webcrypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    chave,
    deBase64Url(assinatura),
    emBytes(`${cabecalho}.${conteudo}`),
  )
}

// Abertura de aes128gcm pela ótica do aparelho, como manda a RFC 8291.
async function decifrar(corpo: Bytes, aparelho: Aparelho): Promise<string> {
  const sal = corpo.subarray(0, 16)
  const doServidor = corpo.subarray(21, 21 + corpo[20])
  const cifrado = corpo.subarray(21 + corpo[20])

  const publicaDoServidor = await webcrypto.subtle.importKey(
    'raw',
    doServidor,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const compartilhado = new Uint8Array(
    await webcrypto.subtle.deriveBits({ name: 'ECDH', public: publicaDoServidor }, aparelho.privada, 256),
  )

  const info = juntar(emBytes('WebPush: info'), Uint8Array.of(0), aparelho.publica, doServidor)
  const ikm = await hmac(await hmac(aparelho.segredo, compartilhado), juntar(info, Uint8Array.of(1)))
  const prk = await hmac(sal, ikm)
  const rotulo = (nome: string) => juntar(emBytes(`Content-Encoding: ${nome}`), Uint8Array.of(0), Uint8Array.of(1))

  const cek = (await hmac(prk, rotulo('aes128gcm'))).subarray(0, 16)
  const nonce = (await hmac(prk, rotulo('nonce'))).subarray(0, 12)
  const chave = await webcrypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt'])
  const aberto = new Uint8Array(
    await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, chave, cifrado),
  )

  return new TextDecoder().decode(aberto.subarray(0, -1))
}

async function hmac(chave: Bytes, dado: Bytes): Promise<Bytes> {
  const importada = await webcrypto.subtle.importKey('raw', chave, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])

  return new Uint8Array(await webcrypto.subtle.sign('HMAC', importada, dado))
}

function juntar(...partes: Bytes[]): Bytes {
  const saida = new Uint8Array(partes.reduce((total, parte) => total + parte.length, 0))
  let posicao = 0

  for (const parte of partes) {
    saida.set(parte, posicao)
    posicao += parte.length
  }

  return saida
}

function emBytes(valor: string): Bytes {
  return new TextEncoder().encode(valor)
}

function base64Url(bytes: Bytes): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(texto: string): Bytes {
  return new Uint8Array(Buffer.from(texto.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))
}
