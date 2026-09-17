import { readFileSync } from 'node:fs'
import { WordIlegivel, extrairLetra } from '../src/letra/docx'

const caminho = process.argv[2]

if (!caminho) {
  console.error('Uso: npm run letra -- "<caminho do .docx>"')
  process.exit(1)
}

try {
  const letra = extrairLetra(new Uint8Array(readFileSync(caminho)))

  for (const linha of letra.cabecalho) console.log(`[C] ${linha}`)
  if (letra.cabecalho.length) console.log('')

  for (const bloco of letra.blocos) {
    if (bloco.tipo === 'marcador') {
      console.log(`[M] ${bloco.texto}`)
      continue
    }

    for (const linha of bloco.linhas) console.log(`${linha.forte ? '[F] ' : '    '}${linha.texto}`)
    console.log('')
  }
} catch (erro) {
  if (!(erro instanceof WordIlegivel)) throw erro

  console.error(`Word ilegível: ${erro.motivo}`)
  process.exit(1)
}
