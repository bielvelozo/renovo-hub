import { describe, expect, it } from 'vitest'
import { ministerioDeExemplo } from './exemplo'
import {
  buscaNoCifraClub,
  capaAlternativa,
  capaDaMusica,
  linkDaPlaylist,
  linkDeVideos,
  linkDoVideo,
  videoIdDoLink,
} from './musica'
import { escalaPorId, musicaPorId } from './escala'
import type { Ministerio } from './tipos'

const m = ministerioDeExemplo()

describe('videoIdDoLink', () => {
  it('extrai o id das formas de link do YouTube', () => {
    expect(videoIdDoLink('https://youtu.be/hRJUcvsnqKs')).toBe('hRJUcvsnqKs')
    expect(videoIdDoLink('https://www.youtube.com/watch?v=hRJUcvsnqKs&list=PL1')).toBe('hRJUcvsnqKs')
    expect(videoIdDoLink('https://www.youtube.com/shorts/hRJUcvsnqKs')).toBe('hRJUcvsnqKs')
    expect(videoIdDoLink('https://www.youtube.com/embed/hRJUcvsnqKs')).toBe('hRJUcvsnqKs')
  })

  it('aceita o id colado sozinho', () => {
    expect(videoIdDoLink('hRJUcvsnqKs')).toBe('hRJUcvsnqKs')
  })

  it('devolve nulo pro que não é link de vídeo', () => {
    expect(videoIdDoLink('https://open.spotify.com/track/123')).toBeNull()
    expect(videoIdDoLink('')).toBeNull()
  })
})

describe('linkDoVideo', () => {
  it('abre o vídeo do começo quando não há minutagem', () => {
    expect(linkDoVideo(musicaPorId(m, 'meia-noite'))).toBe('https://youtu.be/hRJUcvsnqKs')
  })

  it('abre na minutagem do Trecho', () => {
    expect(linkDoVideo(musicaPorId(m, 'sublime'), '2:10')).toBe('https://youtu.be/7GWZwO0MdsY?t=130')
  })
})

describe('capaDaMusica', () => {
  it('deriva a capa do id do vídeo, com alternativa de menor resolução', () => {
    expect(capaDaMusica('hRJUcvsnqKs')).toBe('https://i.ytimg.com/vi/hRJUcvsnqKs/maxresdefault.jpg')
    expect(capaAlternativa('hRJUcvsnqKs')).toBe('https://i.ytimg.com/vi/hRJUcvsnqKs/hqdefault.jpg')
  })
})

describe('linkDaPlaylist', () => {
  it('leva só as Músicas inteiras, na ordem do Repertório', () => {
    expect(linkDaPlaylist(m, escalaPorId(m, 'e0830'))).toBe(
      'https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,IxpWNuxGmzc',
    )
  })

  it('devolve nulo quando o Repertório não tem Música inteira', () => {
    expect(linkDaPlaylist(m, escalaPorId(m, 'e0920'))).toBeNull()
  })

  it('corta em 50 vídeos, que é o limite do link', () => {
    const escala = escalaPorId(m, 'e0830')
    const cheia = {
      ...escala,
      itens: Array.from({ length: 60 }, (_, i) => ({
        id: 'i' + i,
        tipo: 'inteira' as const,
        musicaId: 'meia-noite',
        tom: 'G',
        observacao: '',
        ministradoPor: null,
      })),
    }
    const link = linkDaPlaylist(m as Ministerio, cheia)

    expect(link?.split('video_ids=')[1].split(',')).toHaveLength(50)
  })
})

describe('linkDeVideos', () => {
  it('monta o link a partir de uma lista de ids', () => {
    expect(linkDeVideos(['hRJUcvsnqKs', 'IxpWNuxGmzc'])).toBe(
      'https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,IxpWNuxGmzc',
    )
  })

  it('devolve nulo sem ids', () => {
    expect(linkDeVideos([])).toBeNull()
  })

  it('corta em 50 ids', () => {
    const link = linkDeVideos(Array.from({ length: 60 }, () => 'hRJUcvsnqKs'))

    expect(link?.split('video_ids=')[1].split(',')).toHaveLength(50)
  })
})

describe('buscaNoCifraClub', () => {
  it('monta a busca pelo título da Música', () => {
    expect(buscaNoCifraClub(musicaPorId(m, 'em-teus-bracos'))).toBe(
      'https://www.cifraclub.com.br/?q=Em%20Teus%20Bra%C3%A7os',
    )
  })
})
