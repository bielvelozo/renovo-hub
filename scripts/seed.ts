import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FUNCOES } from '../src/dominio/exemplo'
import { dadosDaDemonstracao } from '../src/semente/demonstracao'
import { membrosDoCsv, musicasDoCsv, sqlBase, sqlDemonstracao } from '../src/semente/roteiro'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const demo = process.argv.includes('--demo')
const agora = new Date().toISOString()

const sql =
  sqlBase({
    agora,
    funcoes: FUNCOES,
    membros: membrosDoCsv(ler('seed/membros.csv')),
    catalogo: musicasDoCsv(ler('seed/playlist.csv')),
    formacoes: ['Banda'],
  }) + (demo ? sqlDemonstracao({ ...dadosDaDemonstracao(), agora }) : '')

const arquivo = resolve(raiz, '.wrangler/tmp/semente.sql')
mkdirSync(dirname(arquivo), { recursive: true })
writeFileSync(arquivo, sql, 'utf8')

const wrangler = resolve(raiz, 'node_modules/wrangler/bin/wrangler.js')
const resultado = spawnSync(
  process.execPath,
  [wrangler, 'd1', 'execute', 'renovo-hub', '--local', '--file', arquivo, '--yes'],
  { cwd: raiz, stdio: ['ignore', 'ignore', 'inherit'] },
)

if (resultado.status !== 0) {
  console.error('Falhou ao aplicar a semente. SQL gerado em ' + arquivo)
  process.exit(resultado.status ?? 1)
}

console.log(`Semente aplicada${demo ? ' com dados de demonstração' : ''}.`)

function ler(caminho: string): string {
  return readFileSync(resolve(raiz, caminho), 'utf8')
}
