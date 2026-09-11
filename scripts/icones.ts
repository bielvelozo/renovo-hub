import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { seloSvg } from '../src/marca/selo'
import { CORES_FIXAS, FUNDO_ESCURO, carregarFontes, desenharAbertura, desenharSeloCompleto } from './marca'

const DESTINO = 'public'

const ABERTURA = { largura: 1170, altura: 2532 }

async function main(): Promise<void> {
  await mkdir(DESTINO, { recursive: true })

  const fontes = await carregarFontes()
  const seloCompleto = desenharSeloCompleto(fontes, CORES_FIXAS)
  const seloPequeno = seloSvg({ pequeno: true, cores: CORES_FIXAS })

  await escrever('icone-192.png', await sobreFundo(seloCompleto, 192, 0.86))
  await escrever('icone-512.png', await sobreFundo(seloCompleto, 512, 0.86))
  await escrever('apple-touch-icon.png', await sobreFundo(seloCompleto, 180, 0.86))
  await escrever('favicon-32.png', await sobreFundo(seloPequeno, 32, 0.94))
  await escrever('icone-mascaravel-512.png', await sobreFundo(seloCompleto, 512, 0.6))
  await escrever('abertura.png', await rasterizar(desenharAbertura(fontes), ABERTURA.largura, ABERTURA.altura))
}

function rasterizar(svg: string, largura: number, altura: number): Promise<Buffer> {
  const comTamanho = svg.replace('<svg ', `<svg width="${largura}" height="${altura}" `)
  return sharp(Buffer.from(comTamanho)).png().toBuffer()
}

async function sobreFundo(svg: string, lado: number, fracao: number): Promise<Buffer> {
  const conteudo = Math.round(lado * fracao)
  return sharp({ create: { width: lado, height: lado, channels: 4, background: FUNDO_ESCURO } })
    .composite([{ input: await rasterizar(svg, conteudo, conteudo), gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function escrever(nome: string, conteudo: Buffer): Promise<void> {
  await writeFile(`${DESTINO}/${nome}`, conteudo)
  console.log(`${DESTINO}/${nome} — ${(conteudo.byteLength / 1024).toFixed(1)} KB`)
}

await main()
