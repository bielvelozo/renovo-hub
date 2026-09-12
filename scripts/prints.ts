import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'
import type { Page } from 'puppeteer-core'

const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.BASE ?? 'http://localhost:8787'
const LARGURA = 375
const ALTURA = 812

type Ids = { escala: string; musica: string; formacao: string }
type Tema = 'claro' | 'escuro'

const TELAS: [string, string | ((ids: Ids) => string)][] = [
  ['inicio', '/'],
  ['mes', '/mes'],
  ['escala', (ids) => `/escalas/${ids.escala}`],
  ['equipe', (ids) => `/escalas/${ids.escala}/equipe`],
  ['adicionar', (ids) => `/escalas/${ids.escala}/adicionar`],
  ['medley', (ids) => `/escalas/${ids.escala}/medley?escolher=1`],
  ['musicas', '/musicas'],
  ['musica', (ids) => `/musicas/${ids.musica}`],
  ['sugestoes', '/sugestoes'],
  ['sugestoes-guardadas', '/sugestoes?aba=guardadas'],
  ['sugestoes-aceitas', '/sugestoes?aba=aceitas'],
  ['sugerir', '/sugestoes?sugerir=1'],
  ['sugerir-envio', (ids) => `/sugestoes?sugerir=${ids.musica}`],
  ['perfil', '/perfil'],
  ['admin', '/admin'],
  ['admin-membros', '/admin/membros'],
  ['admin-convites', '/admin/convites'],
  ['admin-funcoes', '/admin/funcoes'],
  ['admin-formacoes', '/admin/formacoes'],
  ['admin-formacao', (ids) => `/admin/formacoes/${ids.formacao}`],
  ['admin-musicas', '/admin/musicas'],
  ['admin-sequencias', '/admin/sequencias'],
  ['entrar', '/entrar/link-invalido'],
  ['esqueci', '/esqueci'],
  ['instalar', '/instalar'],
  ['nao-encontrada', '/nao-existe'],
]

const opcoes = lerOpcoes(process.argv.slice(2))
const pasta = resolve(opcoes.pasta ?? '.scratch/f1-evidencias')
const prefixo = opcoes.prefixo ? `${opcoes.prefixo}-` : ''
const temas: Tema[] = opcoes.tema === 'claro' || opcoes.tema === 'escuro' ? [opcoes.tema] : ['claro', 'escuro']
const escolhidas = opcoes.telas ? new Set(opcoes.telas.split(',')) : null

await mkdir(pasta, { recursive: true })

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true })

try {
  const pagina = await navegador.newPage()
  await pagina.setViewport({ width: LARGURA, height: ALTURA, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await pagina.goto(convite(opcoes.membro ?? 'Gabriel'), { waitUntil: 'networkidle0' })
  await pagina.evaluate(`localStorage.removeItem('renovo:tema')`)

  const ids = await descobrirIds(pagina)

  for (const tema of temas) {
    await pagina.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: tema === 'claro' ? 'light' : 'dark' }])

    for (const [indice, [nome, caminho]] of TELAS.entries()) {
      if (escolhidas && !escolhidas.has(nome)) continue
      const rota = typeof caminho === 'string' ? caminho : caminho(ids)
      const arquivo = resolve(pasta, `${prefixo}${String(indice + 1).padStart(2, '0')}-${nome}-${tema}.png`)

      await pagina.goto(`${BASE}${rota}`, { waitUntil: 'networkidle0' })
      await pagina.evaluate('document.fonts.ready')
      await new Promise((r) => setTimeout(r, 400))
      await pagina.screenshot({ path: arquivo as `${string}.png` })
      console.log(arquivo)
    }
  }
} finally {
  await navegador.close()
}

function convite(membro: string): string {
  const saida = spawnSync('npm', ['run', 'convite', '--', membro], { encoding: 'utf-8', shell: true })
  const url = saida.stdout.match(/https?:\/\/\S+/)?.[0]
  if (!url) throw new Error(`Não consegui gerar o convite: ${saida.stdout}${saida.stderr}`)
  return url.replace(/^https?:\/\/[^/]+/, BASE)
}

async function descobrirIds(pagina: Page): Promise<Ids> {
  const fixos = JSON.stringify({ escala: opcoes.escala, musica: opcoes.musica, formacao: opcoes.formacao })
  return pagina.evaluate(`(async () => {
    const fixos = ${fixos}
    const ler = (caminho) => fetch(caminho).then((r) => r.json())
    const { escalas } = await ler('/api/escalas')
    const { musicas } = await ler('/api/musicas')
    const { formacoes } = await ler('/api/formacoes')
    const escala =
      escalas.filter((e) => e.estado === 'agendada').sort((a, b) => b.quantidadeDeItens - a.quantidadeDeItens)[0] ??
      escalas[0]
    return {
      escala: fixos.escala ?? escala?.id ?? '',
      musica: fixos.musica ?? musicas[0]?.id ?? '',
      formacao: fixos.formacao ?? formacoes[0]?.id ?? '',
    }
  })()`) as Promise<Ids>
}

function lerOpcoes(argumentos: string[]): Record<string, string | undefined> {
  const lidas: Record<string, string | undefined> = {}
  for (let i = 0; i < argumentos.length; i++) {
    const nome = argumentos[i]
    if (nome.startsWith('--')) lidas[nome.slice(2)] = argumentos[i + 1]?.startsWith('--') ? '' : argumentos[++i]
  }
  return lidas
}
