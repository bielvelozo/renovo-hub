import { capaAlternativa, capaDaMusica } from '../../src/dominio'
import type { DadosDoVideo } from './oembed'

const MAXIMO_DE_ACHADOS = 12

export async function buscarNoYoutube(chave: string, termo: string): Promise<DadosDoVideo[] | null> {
  const endereco =
    'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=' +
    MAXIMO_DE_ACHADOS +
    '&q=' +
    encodeURIComponent(termo) +
    '&key=' +
    encodeURIComponent(chave)

  let resposta: Response
  try {
    resposta = await fetch(endereco)
  } catch {
    return null
  }

  if (!resposta.ok) return null

  const corpo = await resposta.json<{
    items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[]
  }>()

  return (corpo.items ?? [])
    .map((item) => ({
      videoId: item.id?.videoId ?? '',
      titulo: decodificar(item.snippet?.title ?? ''),
      canal: decodificar(item.snippet?.channelTitle ?? ''),
      capa: capaDaMusica(item.id?.videoId ?? ''),
      capaAlternativa: capaAlternativa(item.id?.videoId ?? ''),
    }))
    .filter((achado) => achado.videoId && achado.titulo)
}

// A API devolve o título com as entidades HTML do YouTube (&amp;, &#39;), e o app
// mostra o texto cru: sem isso, "Eric &amp; Evellyn" entraria assim no catálogo.
function decodificar(texto: string): string {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
