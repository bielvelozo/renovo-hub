import { spawn, spawnSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { cookieDaSessao, tokenDoConvite } from '../../src/fumaca/leitura'
import { PORTA, RAIZ, buscar } from './prova'

export type Servidor = { processo: ChildProcess; log: () => string }

export function comandos(raiz: string) {
  const wrangler = resolve(raiz, 'node_modules/wrangler/bin/wrangler.js')
  const tsx = resolve(raiz, 'node_modules/tsx/dist/cli.mjs')

  return {
    rodar(argumentos: string[], rotulo: string): string {
      const resultado = spawnSync(process.execPath, argumentos, { cwd: raiz, encoding: 'utf8', stdio: 'pipe' })

      if (resultado.status !== 0) {
        throw new Error(`${rotulo} falhou:\n${resultado.stdout ?? ''}\n${resultado.stderr ?? ''}`)
      }

      return `${resultado.stdout ?? ''}${resultado.stderr ?? ''}`
    },
    wrangler,
    tsx,
  }
}

export function limparAmbiente(raiz: string): void {
  matarServidoresAntigos()
  rmSync(resolve(raiz, '.wrangler/state/v3/d1'), { recursive: true, force: true })
}

export function matarServidoresAntigos(): void {
  if (process.platform === 'win32') {
    const script = [
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\"",
      `| Where-Object { $_.CommandLine -like '*wrangler*dev*' -and $_.CommandLine -like '*--port ${PORTA}*' }`,
      '| ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }',
      '; Start-Sleep -Milliseconds 300',
      `; Get-NetTCPConnection -LocalPort ${PORTA} -State Listen -ErrorAction SilentlyContinue`,
      '| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }',
    ].join(' ')

    spawnSync('powershell', ['-NoProfile', '-Command', script], { stdio: 'ignore' })
    return
  }

  spawnSync('pkill', ['-f', `wrangler.*dev.*--port ${PORTA}`], { stdio: 'ignore' })
}

export function exigirBuild(raiz: string): void {
  if (existsSync(resolve(raiz, 'dist/index.html'))) return

  throw new Error('Não achei dist/index.html. Rode npm run build antes do smoke.')
}

export async function subirServidor(raiz: string): Promise<Servidor> {
  const { wrangler } = comandos(raiz)
  const pedacos: string[] = []

  const processo = spawn(
    process.execPath,
    [wrangler, 'dev', '--port', String(PORTA), '--ip', '127.0.0.1', '--test-scheduled'],
    { cwd: raiz, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  processo.stdout?.on('data', (dado) => pedacos.push(String(dado)))
  processo.stderr?.on('data', (dado) => pedacos.push(String(dado)))

  const log = () => pedacos.join('')

  for (let tentativa = 0; tentativa < 120; tentativa += 1) {
    if (processo.exitCode !== null) throw new Error(`O wrangler dev morreu ao subir:\n${log()}`)

    const saude = await fetch(`${RAIZ}/api/saude`)
      .then((r) => r.json() as Promise<{ ok?: boolean }>)
      .catch(() => null)

    if (saude?.ok) return { processo, log }

    await esperar(500)
  }

  processo.kill()
  throw new Error(`O wrangler dev não respondeu em /api/saude:\n${log()}`)
}

export function derrubarServidor(servidor: Servidor): void {
  servidor.processo.kill()
  matarServidoresAntigos()
}

export function migrarESemear(raiz: string): void {
  const { rodar, wrangler, tsx } = comandos(raiz)

  rodar([wrangler, 'd1', 'migrations', 'apply', 'renovo-hub', '--local'], 'db:migrate')
  rodar([tsx, resolve(raiz, 'scripts/seed.ts'), '--demo'], 'db:seed --demo')
  rodar([tsx, resolve(raiz, 'scripts/titulos.ts')], 'titulos')
}

export async function sessaoPorConvite(raiz: string, nome: string): Promise<string> {
  const { rodar, tsx } = comandos(raiz)
  const saida = rodar([tsx, resolve(raiz, 'scripts/convite.ts'), nome], `convite de ${nome}`)
  const token = tokenDoConvite(saida)

  if (!token) throw new Error(`O convite de ${nome} não imprimiu link:\n${saida}`)

  const resposta = await buscar(`${RAIZ}/entrar/${token}`, { redirect: 'manual' })
  const cookie = cookieDaSessao(resposta.headers.get('set-cookie'))

  if (!cookie) throw new Error(`Abrir /entrar/${token} não devolveu cookie de sessão (${resposta.status}).`)

  return cookie
}

export async function sessaoPorEsqueci(membroId: string): Promise<string> {
  const resposta = await buscar(`${RAIZ}/api/esqueci`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ membroId }),
  })

  const cookie = cookieDaSessao(resposta.headers.get('set-cookie'))

  if (!cookie) throw new Error(`Entrar como ${membroId} pelo "esqueci" não devolveu cookie (${resposta.status}).`)

  return cookie
}

export function consultar(raiz: string, sql: string): Record<string, unknown>[] {
  const { rodar, wrangler } = comandos(raiz)
  const saida = rodar(
    [wrangler, 'd1', 'execute', 'renovo-hub', '--local', '--command', sql, '--json', '--yes'],
    `consulta ao D1 (${sql.slice(0, 40)})`,
  )

  const json = saida.slice(saida.indexOf('['))

  return (JSON.parse(json) as { results: Record<string, unknown>[] }[])[0]?.results ?? []
}

export function esperar(ms: number): Promise<void> {
  return new Promise((pronto) => setTimeout(pronto, ms))
}
