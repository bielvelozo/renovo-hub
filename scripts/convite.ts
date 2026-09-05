import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { idDoNome, inserirOuIgnorar } from '../src/semente/sql'

type MembroDoBanco = { id: string; nome: string }

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wrangler = resolve(raiz, 'node_modules/wrangler/bin/wrangler.js')
const procurado = process.argv[2]

if (!procurado) {
  console.error('Uso: npm run convite -- "Gabriel"')
  process.exit(1)
}

const membros = consultar<MembroDoBanco>('SELECT id, nome FROM membros ORDER BY nome')
const alvo = idDoNome(procurado)
const membro = membros.find((linha) => linha.id === alvo || idDoNome(linha.nome) === alvo)

if (!membro) {
  console.error(`Não achei o Membro "${procurado}".`)
  console.error(
    membros.length
      ? 'Membros cadastrados: ' + membros.map((linha) => linha.nome).join(', ')
      : 'Nenhum Membro cadastrado. Rode npm run db:seed antes.',
  )
  process.exit(1)
}

const token = crypto.randomUUID()

executar([
  '--command',
  inserirOuIgnorar('convites', { token, membro_id: membro.id, criado_em: new Date().toISOString() }),
])

console.log(`Convite para ${membro.nome}:`)
console.log(`http://localhost:8787/entrar/${token}`)

function executar(argumentos: string[], capturar = false) {
  const resultado = spawnSync(
    process.execPath,
    [wrangler, 'd1', 'execute', 'renovo-hub', '--local', ...argumentos, '--yes'],
    { cwd: raiz, encoding: 'utf8', stdio: ['ignore', capturar ? 'pipe' : 'ignore', 'inherit'] },
  )

  if (resultado.status !== 0) {
    console.error('Falhou ao falar com o banco local. Rode npm run db:migrate antes.')
    process.exit(resultado.status ?? 1)
  }

  return resultado.stdout ?? ''
}

function consultar<T>(sql: string): T[] {
  const saida = executar(['--command', sql, '--json'], true)
  const json = saida.slice(saida.indexOf('['))

  return (JSON.parse(json) as { results: T[] }[])[0]?.results ?? []
}

