import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { limparTitulo } from '../src/dominio/titulo'
import { valorSql } from '../src/semente/sql'

type LinhaDeMusica = { id: string; titulo: string; artista: string }

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const remoto = process.argv.includes('--remote')
const alvo = remoto ? '--remote' : '--local'
const wrangler = resolve(raiz, 'node_modules/wrangler/bin/wrangler.js')

const aRevisar = consultar('select id, titulo, artista from musicas where revisar = 1 order by titulo')
const limpas = aRevisar.map((linha) => ({ ...linha, limpo: limparTitulo(linha.titulo, linha.artista) }))
const instaveis = limpas.filter(({ limpo }) => {
  const denovo = limparTitulo(limpo.titulo, limpo.artista)
  return denovo.titulo !== limpo.titulo || denovo.artista !== limpo.artista
})

if (instaveis.length) {
  for (const { titulo, artista, limpo } of instaveis) console.error(`  ${titulo} · ${artista}  →  ${limpo.titulo} · ${limpo.artista}`)
  console.error(`${instaveis.length} título(s) mudariam de novo numa segunda passada. Nada foi gravado; corrija limparTitulo.`)
  process.exit(1)
}

const mudancas = limpas.filter(({ titulo, artista, limpo }) => limpo.titulo !== titulo || limpo.artista !== artista)

if (!mudancas.length) {
  console.log(`Nada a limpar: ${aRevisar.length} título(s) a revisar já estão limpos (${remoto ? 'remoto' : 'local'}).`)
  process.exit(0)
}

const sql = mudancas
  .map(
    ({ id, limpo }) =>
      `UPDATE musicas SET titulo = ${valorSql(limpo.titulo)}, artista = ${valorSql(limpo.artista)} WHERE id = ${valorSql(id)};`,
  )
  .join('\n')

const arquivo = resolve(raiz, '.wrangler/tmp/titulos.sql')
mkdirSync(dirname(arquivo), { recursive: true })
writeFileSync(arquivo, sql + '\n', 'utf8')

executar(['--file', arquivo], 'aplicar os títulos limpos')

for (const { titulo, artista, limpo } of mudancas) {
  console.log(`  ${titulo} · ${artista}  →  ${limpo.titulo} · ${limpo.artista}`)
}
console.log(`${mudancas.length} título(s) limpos no D1 ${remoto ? 'remoto' : 'local'}; continuam marcados pra revisar.`)

function consultar(comando: string): LinhaDeMusica[] {
  const saida = executar(['--command', comando, '--json'], 'ler as músicas a revisar')
  const json = saida.slice(saida.indexOf('['))

  return (JSON.parse(json) as { results: LinhaDeMusica[] }[])[0]?.results ?? []
}

function executar(argumentos: string[], rotulo: string): string {
  const resultado = spawnSync(
    process.execPath,
    [wrangler, 'd1', 'execute', 'renovo-hub', alvo, ...argumentos, '--yes'],
    { cwd: raiz, encoding: 'utf8', stdio: 'pipe' },
  )

  if (resultado.status !== 0) {
    console.error(`Falhou ao ${rotulo}:\n${resultado.stdout ?? ''}\n${resultado.stderr ?? ''}`)
    process.exit(resultado.status ?? 1)
  }

  return resultado.stdout ?? ''
}
