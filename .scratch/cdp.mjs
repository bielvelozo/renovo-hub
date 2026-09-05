import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORTA = 9222
const BASE = 'http://localhost:8787'
const COOKIE = process.argv[2]
const TEMA = process.argv[3] ?? 'dark'
const MODO = process.argv[4] ?? 'browser'

const perfil = mkdtempSync(join(tmpdir(), 'cdp-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORTA}`,
  `--user-data-dir=${perfil}`,
  '--no-first-run',
  '--disable-gpu',
  'about:blank',
])

async function esperarChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${PORTA}/json/version`)
      if (r.ok) return (await r.json()).webSocketDebuggerUrl
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('Chrome não abriu')
}

function conectar(url) {
  const ws = new WebSocket(url)
  const pendentes = new Map()
  const eventos = []
  let n = 0

  const pronto = new Promise((ok, falha) => {
    ws.addEventListener('open', ok)
    ws.addEventListener('error', falha)
  })

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pendentes.has(msg.id)) {
      const { ok, falha } = pendentes.get(msg.id)
      pendentes.delete(msg.id)
      msg.error ? falha(new Error(JSON.stringify(msg.error))) : ok(msg.result)
    } else {
      eventos.push(msg)
    }
  })

  return {
    pronto,
    eventos,
    enviar(method, params = {}, sessionId) {
      const id = ++n
      return new Promise((ok, falha) => {
        pendentes.set(id, { ok, falha })
        ws.send(JSON.stringify({ id, method, params, sessionId }))
      })
    },
    fechar: () => ws.close(),
  }
}

const wsUrl = await esperarChrome()
const cdp = conectar(wsUrl)
await cdp.pronto

const alvo = await cdp.enviar('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cdp.enviar('Target.attachToTarget', { targetId: alvo.targetId, flatten: true })
const chamar = (m, p) => cdp.enviar(m, p, sessionId)

await chamar('Page.enable')
await chamar('Runtime.enable')
await chamar('Network.enable')
await chamar('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})
await chamar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: TEMA }] })

// `Emulation.setEmulatedMedia` não cobre display-mode: pra fingir o app na tela
// inicial, a resposta do matchMedia é trocada antes do código da página rodar.
if (MODO === 'standalone') {
  await chamar('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      const original = window.matchMedia.bind(window)
      window.matchMedia = (consulta) =>
        consulta.includes('display-mode: standalone') ? { matches: true, media: consulta, addEventListener() {}, removeEventListener() {} } : original(consulta)
    `,
  })
}

if (COOKIE) {
  const [nome, valor] = COOKIE.split('=')
  await chamar('Network.setCookie', { name: nome, value: valor, domain: 'localhost', path: '/' })
}

const erros = []
cdp.eventos.length = 0

async function ir(caminho) {
  await chamar('Page.navigate', { url: BASE + caminho })
  await new Promise((r) => setTimeout(r, 1400))
}

async function avaliar(expressao) {
  const r = await chamar('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}

async function foto(nome) {
  const { data } = await chamar('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join('.scratch', nome), Buffer.from(data, 'base64'))
}

const roteiro = JSON.parse(process.env.ROTEIRO ?? '[]')
const saida = []

for (const passo of roteiro) {
  if (passo.ir) await ir(passo.ir)
  if (passo.esperar) await new Promise((r) => setTimeout(r, passo.esperar))
  if (passo.avaliar) saida.push({ nome: passo.nome, valor: await avaliar(passo.avaliar) })
  if (passo.foto) await foto(passo.foto)
}

for (const evento of cdp.eventos) {
  if (evento.method === 'Runtime.consoleAPICalled' && evento.params.type === 'error') {
    erros.push(evento.params.args.map((a) => a.value ?? a.description).join(' '))
  }
  if (evento.method === 'Runtime.exceptionThrown') {
    erros.push(evento.params.exceptionDetails.text + ' ' + (evento.params.exceptionDetails.exception?.description ?? ''))
  }
}

console.log(JSON.stringify({ saida, erros }, null, 2))

cdp.fechar()
chrome.kill()
process.exit(0)
