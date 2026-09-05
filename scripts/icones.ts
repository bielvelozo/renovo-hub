import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const SIMBOLO = 'docs/brand/logo/simbolo-arvore-anel-sobre-branco.png'
const MARCA_SOBRE_PRETO = 'docs/brand/logo/logo-horizontal-sobre-preto.png'
const MARCA_SOBRE_BRANCO = 'docs/brand/logo/logo-horizontal-sobre-branco.png'
const DESTINO = 'public'

const FUNDO_ESCURO = '#282828'
const LADO_MASCARAVEL = 512
const ALTURA_DA_MARCA = 128
// As duas marcas recortam em larguras um pouco diferentes; a mesma tela nas duas evita
// o cabeçalho pular quando o tema troca.
const LARGURA_DA_MARCA = 470

type Pixel = { r: number; g: number; b: number }

const claro = (limite: number) => (p: Pixel) => p.r >= limite && p.g >= limite && p.b >= limite
const escuro = (limite: number) => (p: Pixel) => p.r <= limite && p.g <= limite && p.b <= limite

async function main(): Promise<void> {
  await mkdir(DESTINO, { recursive: true })

  const simbolo = await semFundoAoRedor(SIMBOLO, claro(200))

  await escrever('icone-192.png', await redimensionar(simbolo, 192))
  await escrever('icone-512.png', await redimensionar(simbolo, 512))
  await escrever('favicon-32.png', await redimensionar(simbolo, 32))
  await escrever('icone-mascaravel-512.png', await mascaravel(simbolo))
  await escrever('apple-touch-icon.png', await sobreFundo(simbolo, 180, 160))

  await escrever('marca-escuro.png', await marca(MARCA_SOBRE_PRETO, escuro(60)))
  await escrever('marca-claro.png', await marca(MARCA_SOBRE_BRANCO, claro(215)))
}

async function semFundoAoRedor(arquivo: string, ehFundo: (p: Pixel) => boolean): Promise<Buffer> {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const fora = new Uint8Array(width * height)
  const pilha: number[] = []

  const empilhar = (p: number) => {
    if (fora[p]) return
    const i = p * 4
    if (!ehFundo({ r: data[i], g: data[i + 1], b: data[i + 2] })) return
    fora[p] = 1
    pilha.push(p)
  }

  for (let x = 0; x < width; x++) {
    empilhar(x)
    empilhar((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    empilhar(y * width)
    empilhar(y * width + width - 1)
  }

  while (pilha.length) {
    const p = pilha.pop()!
    const x = p % width
    if (x > 0) empilhar(p - 1)
    if (x < width - 1) empilhar(p + 1)
    if (p >= width) empilhar(p - width)
    if (p < (height - 1) * width) empilhar(p + width)
  }

  for (let p = 0; p < width * height; p++) if (fora[p]) data[p * 4 + 3] = 0

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()
}

async function semFundoTodo(arquivo: string, ehFundo: (p: Pixel) => boolean): Promise<Buffer> {
  const { data, info } = await sharp(arquivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    if (ehFundo({ r: data[i], g: data[i + 1], b: data[i + 2] })) data[i + 3] = 0
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
}

function redimensionar(imagem: Buffer, lado: number): Promise<Buffer> {
  return sharp(imagem).resize(lado, lado, { fit: 'contain', background: TRANSPARENTE }).png().toBuffer()
}

// A área garantida de um ícone mascarável é o círculo central de 80% do lado: o símbolo já é
// circular, então cabe inteiro nela quando ocupa 80% da tela.
function mascaravel(simbolo: Buffer): Promise<Buffer> {
  return sobreFundo(simbolo, LADO_MASCARAVEL, Math.round(LADO_MASCARAVEL * 0.8))
}

async function sobreFundo(simbolo: Buffer, lado: number, conteudo: number): Promise<Buffer> {
  return sharp({ create: { width: lado, height: lado, channels: 4, background: FUNDO_ESCURO } })
    .composite([{ input: await redimensionar(simbolo, conteudo), gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function marca(arquivo: string, ehFundo: (p: Pixel) => boolean): Promise<Buffer> {
  const recortada = await sharp(await semFundoTodo(arquivo, ehFundo))
    .trim({ background: TRANSPARENTE, threshold: 0 })
    .png()
    .toBuffer()

  return sharp(recortada)
    .resize(LARGURA_DA_MARCA, ALTURA_DA_MARCA, {
      fit: 'contain',
      position: 'left',
      background: TRANSPARENTE,
    })
    .png()
    .toBuffer()
}

async function escrever(nome: string, conteudo: Buffer): Promise<void> {
  await writeFile(`${DESTINO}/${nome}`, conteudo)
  console.log(`${DESTINO}/${nome} — ${(conteudo.byteLength / 1024).toFixed(1)} KB`)
}

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 }

await main()
