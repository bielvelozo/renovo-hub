import { recorteQuadrado } from './perfil'

export const LADO_DA_FOTO = 256

class FotoIlegivel extends Error {}

export async function reduzirFoto(arquivo: File): Promise<File> {
  const imagem = await abrir(arquivo)
  const recorte = recorteQuadrado(imagem.naturalWidth, imagem.naturalHeight)
  const lado = Math.min(LADO_DA_FOTO, recorte.lado)

  const tela = document.createElement('canvas')
  tela.width = lado
  tela.height = lado
  const contexto = tela.getContext('2d')
  if (!contexto) throw new FotoIlegivel()

  contexto.imageSmoothingQuality = 'high'
  contexto.drawImage(imagem, recorte.x, recorte.y, recorte.lado, recorte.lado, 0, 0, lado, lado)

  // Safari não gera WebP no canvas e devolve PNG no lugar; aí vai JPEG.
  const webp = await comprimir(tela, 'image/webp', 0.82)
  const blob = webp.type === 'image/webp' ? webp : await comprimir(tela, 'image/jpeg', 0.85)

  return new File([blob], blob.type === 'image/webp' ? 'foto.webp' : 'foto.jpg', { type: blob.type })
}

function abrir(arquivo: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(arquivo)
  const imagem = new Image()

  return new Promise<HTMLImageElement>((pronto, falhou) => {
    imagem.onload = () => pronto(imagem)
    imagem.onerror = () => falhou(new FotoIlegivel())
    imagem.src = url
  }).finally(() => URL.revokeObjectURL(url))
}

function comprimir(tela: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob> {
  return new Promise((pronto, falhou) => {
    tela.toBlob((blob) => (blob ? pronto(blob) : falhou(new FotoIlegivel())), tipo, qualidade)
  })
}
