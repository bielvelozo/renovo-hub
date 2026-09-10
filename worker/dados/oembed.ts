import { capaAlternativa, capaDaMusica } from '../../src/dominio'

export type DadosDoVideo = {
  videoId: string
  titulo: string
  canal: string
  capa: string
  capaAlternativa: string
}

type Consulta = { dados: DadosDoVideo | null; conclusiva: boolean }

const cache = new Map<string, DadosDoVideo | null>()

export function limparCacheDeVideos(): void {
  cache.clear()
}

export async function dadosDoVideo(videoId: string): Promise<DadosDoVideo | null> {
  return (await consultar(videoId)).dados
}

// Nulo quando o YouTube não respondeu: não dá pra concluir que o vídeo sumiu, e
// um indeterminado não pode virar registro nem tirar o vídeo da playlist.
export async function existeNoYoutube(videoId: string): Promise<boolean | null> {
  const { dados, conclusiva } = await consultar(videoId)
  if (!conclusiva) return null

  return dados !== null
}

async function consultar(videoId: string): Promise<Consulta> {
  const guardado = cache.get(videoId)
  if (guardado !== undefined) return { dados: guardado, conclusiva: true }

  const endereco =
    'https://www.youtube.com/oembed?format=json&url=' +
    encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)

  let resposta: Response
  try {
    resposta = await fetch(endereco)
  } catch {
    // Sem resposta do YouTube não dá pra concluir que o vídeo sumiu. Fica fora do
    // cache e vale como indeterminado, pra uma queda de rede não esvaziar a playlist.
    return { dados: null, conclusiva: false }
  }

  if (resposta.status >= 500) return { dados: null, conclusiva: false }

  if (!resposta.ok) {
    cache.set(videoId, null)
    return { dados: null, conclusiva: true }
  }

  const corpo = await resposta.json<{ title?: string; author_name?: string }>()
  const dados: DadosDoVideo = {
    videoId,
    titulo: corpo.title ?? '',
    canal: corpo.author_name ?? '',
    capa: capaDaMusica(videoId),
    capaAlternativa: capaAlternativa(videoId),
  }

  cache.set(videoId, dados)

  return { dados, conclusiva: true }
}
