import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fingirRede } from '../testes/rede'
import { dadosDoVideo, limparCacheDeVideos, videosConfirmados } from './oembed'

const MEIA_NOITE = 'hRJUcvsnqKs'
const FIRME = 'FKKytz49Fhg'

beforeEach(() => limparCacheDeVideos())

afterEach(() => vi.unstubAllGlobals())

describe('dadosDoVideo', () => {
  it('traz título, canal e capas do oEmbed', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite', author_name: 'Fhop Music' } } })

    expect(await dadosDoVideo(MEIA_NOITE)).toEqual({
      videoId: MEIA_NOITE,
      titulo: 'Meia Noite',
      canal: 'Fhop Music',
      capa: `https://i.ytimg.com/vi/${MEIA_NOITE}/maxresdefault.jpg`,
      capaAlternativa: `https://i.ytimg.com/vi/${MEIA_NOITE}/hqdefault.jpg`,
    })
  })

  it('pergunta ao oEmbed pelo link do vídeo, em json', async () => {
    const rede = fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite' } } })

    await dadosDoVideo(MEIA_NOITE)

    expect(rede.chamadas[0]).toBe(
      'https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D' + MEIA_NOITE,
    )
  })

  it('devolve nulo quando o vídeo não existe', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 404 } })

    expect(await dadosDoVideo(MEIA_NOITE)).toBeNull()
  })

  it('guarda em memória: a segunda consulta não chama o oEmbed', async () => {
    const rede = fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite' } } })

    await dadosDoVideo(MEIA_NOITE)
    await dadosDoVideo(MEIA_NOITE)

    expect(rede.chamadas).toHaveLength(1)
  })

  it('guarda também a ausência, pra não repetir a consulta do vídeo morto', async () => {
    const rede = fingirRede({ [MEIA_NOITE]: { status: 404 } })

    await dadosDoVideo(MEIA_NOITE)

    expect(await dadosDoVideo(MEIA_NOITE)).toBeNull()
    expect(rede.chamadas).toHaveLength(1)
  })
})

describe('videosConfirmados', () => {
  it('deixa passar só o que o oEmbed conhece', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite' } }, [FIRME]: { status: 404 } })

    expect(await videosConfirmados([MEIA_NOITE, FIRME])).toEqual([MEIA_NOITE])
  })

  it('mantém o vídeo quando o YouTube devolve erro de servidor', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 503 } })

    expect(await videosConfirmados([MEIA_NOITE])).toEqual([MEIA_NOITE])
  })

  it('mantém o vídeo quando a rede cai, pra não esvaziar a playlist', async () => {
    const rede = fingirRede({ [MEIA_NOITE]: { status: 200, falha: true } })

    expect(await videosConfirmados([MEIA_NOITE])).toEqual([MEIA_NOITE])
    expect(await videosConfirmados([MEIA_NOITE])).toEqual([MEIA_NOITE])
    expect(rede.chamadas).toHaveLength(2)
  })
})
