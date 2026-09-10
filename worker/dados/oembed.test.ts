import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fingirRede } from '../testes/rede'
import { dadosDoVideo, existeNoYoutube, limparCacheDeVideos } from './oembed'

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

describe('existeNoYoutube', () => {
  it('diz que sim pro vídeo que o oEmbed conhece, e não pro que sumiu', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 200, corpo: { title: 'Meia Noite' } }, [FIRME]: { status: 404 } })

    expect(await existeNoYoutube(MEIA_NOITE)).toBe(true)
    expect(await existeNoYoutube(FIRME)).toBe(false)
  })

  it('não conclui nada quando o YouTube devolve erro de servidor', async () => {
    fingirRede({ [MEIA_NOITE]: { status: 503 } })

    expect(await existeNoYoutube(MEIA_NOITE)).toBeNull()
  })

  it('não conclui nada quando a rede cai, e tenta de novo na próxima', async () => {
    const rede = fingirRede({ [MEIA_NOITE]: { status: 200, falha: true } })

    expect(await existeNoYoutube(MEIA_NOITE)).toBeNull()
    expect(await existeNoYoutube(MEIA_NOITE)).toBeNull()
    expect(rede.chamadas).toHaveLength(2)
  })
})
