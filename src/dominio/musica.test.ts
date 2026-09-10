import { describe, expect, it } from 'vitest'
import { medley, ministerioDeExemplo } from './exemplo'
import {
  NOTAS_BRANCAS,
  TOM_ORIGINAL,
  NOTAS_PRETAS,
  buscaNoCifraClub,
  capaAlternativa,
  capaDaMusica,
  combinaBusca,
  linkDaPlaylist,
  linkDeVideos,
  linkDoVideo,
  mesesDesde,
  partesDoTom,
  precisaReconferir,
  achadoCombina,
  pedacosDoTitulo,
  tomDe,
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

  it('aceita o link do YouTube Music, com e sem parâmetro de origem', () => {
    expect(videoIdDoLink('https://music.youtube.com/watch?v=hRJUcvsnqKs')).toBe('hRJUcvsnqKs')
    expect(videoIdDoLink('https://music.youtube.com/watch?v=hRJUcvsnqKs&si=abc123')).toBe('hRJUcvsnqKs')
  })

  it('aceita o link de transmissão ao vivo', () => {
    expect(videoIdDoLink('https://www.youtube.com/live/hRJUcvsnqKs?feature=share')).toBe('hRJUcvsnqKs')
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
  it('leva todo o Repertório na ordem, inteiras e Trechos', () => {
    expect(linkDaPlaylist(m, escalaPorId(m, 'e0830'))).toBe(
      'https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,IxpWNuxGmzc,7GWZwO0MdsY',
    )
  })

  it('abre o Medley trecho a trecho, no lugar dele na ordem', () => {
    const escala = escalaPorId(m, 'e0830')
    const comMedley = {
      ...escala,
      itens: [
        escala.itens[0],
        medley('i9', [
          { musicaId: 'sublime', tom: 'A', inicio: '0:00', fim: '2:30' },
          { musicaId: 'grato', tom: 'C', inicio: '1:12', fim: '3:05' },
        ]),
      ],
    }

    expect(linkDaPlaylist(m, comMedley)).toBe(
      'https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,7GWZwO0MdsY,' +
        musicaPorId(m, 'grato').videoId,
    )
  })

  it('devolve nulo quando o Repertório está vazio', () => {
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

describe('combinaBusca', () => {
  it('acha pelo pedaço do título, sem ligar pra caixa', () => {
    expect(combinaBusca(musicaPorId(m, 'em-teus-bracos'), 'TEUS')).toBe(true)
  })

  it('acha pelo artista', () => {
    expect(combinaBusca(musicaPorId(m, 'meia-noite'), 'fhop')).toBe(true)
  })

  it('acha sem acento quem foi escrito com acento', () => {
    expect(combinaBusca(musicaPorId(m, 'em-teus-bracos'), 'bracos')).toBe(true)
    expect(combinaBusca(musicaPorId(m, 'como-nao-te-amar'), 'nao te amar')).toBe(true)
  })

  it('recusa o que não está no título nem no artista', () => {
    expect(combinaBusca(musicaPorId(m, 'meia-noite'), 'aleluia')).toBe(false)
  })

  it('busca vazia deixa tudo passar', () => {
    expect(combinaBusca(musicaPorId(m, 'meia-noite'), '  ')).toBe(true)
  })
})

describe('mesesDesde', () => {
  it('conta os meses cheios entre duas datas', () => {
    expect(mesesDesde('2026-03-05', '2026-09-05')).toBe(6)
    expect(mesesDesde('2026-03-06', '2026-09-05')).toBe(5)
    expect(mesesDesde('2025-09-05', '2026-09-05')).toBe(12)
  })

  it('data no futuro não conta mês nenhum', () => {
    expect(mesesDesde('2026-10-05', '2026-09-05')).toBe(0)
  })
})

describe('tom maior e menor', () => {
  it('monta o Tom a partir da nota e da qualidade', () => {
    expect(tomDe('G', false)).toBe('G')
    expect(tomDe('B', true)).toBe('Bm')
    expect(tomDe('F#', true)).toBe('F#m')
  })

  it('separa o Tom escrito de volta em nota e qualidade', () => {
    expect(partesDoTom('G')).toEqual({ nota: 'G', menor: false })
    expect(partesDoTom('Bm')).toEqual({ nota: 'B', menor: true })
    expect(partesDoTom('Ebm')).toEqual({ nota: 'Eb', menor: true })
  })

  it('devolve nota vazia pro que não é Tom', () => {
    expect(partesDoTom('')).toEqual({ nota: '', menor: false })
    expect(partesDoTom('qualquer coisa')).toEqual({ nota: '', menor: false })
  })

  it('as doze notas cobrem o teclado, brancas e pretas', () => {
    expect([...NOTAS_BRANCAS, ...NOTAS_PRETAS].sort()).toEqual(
      ['A', 'Ab', 'B', 'Bb', 'C', 'C#', 'D', 'E', 'Eb', 'F', 'F#', 'G'].sort(),
    )
  })
})

describe('pedacosDoTitulo', () => {
  it('separa os dois lados do travessão, porque o YouTube escreve dos dois jeitos', () => {
    expect(pedacosDoTitulo('Alessandro Vilas Boas - Vem Habitar (Clipe Oficial)')).toEqual([
      'Alessandro Vilas Boas',
      'Vem Habitar',
    ])
    expect(pedacosDoTitulo('Permanecerei - Eric & Evellyn Emerick')).toEqual([
      'Permanecerei',
      'Eric & Evellyn Emerick',
    ])
  })

  it('separa no pipe e no bolinha, e tira o que está entre parênteses', () => {
    expect(pedacosDoTitulo('Meia Noite (Ao Vivo) | fhop music')).toEqual(['Meia Noite', 'fhop music'])
    expect(pedacosDoTitulo('Grato Sou (I Thank God) - Ao vivo • DROPS')).toEqual(['Grato Sou', 'Ao vivo', 'DROPS'])
  })

  it('devolve o título cru quando não há o que separar', () => {
    expect(pedacosDoTitulo('Permanecerei')).toEqual(['Permanecerei'])
    expect(pedacosDoTitulo('(Ao Vivo)')).toEqual(['(Ao Vivo)'])
  })
})

describe('achadoCombina', () => {
  const titulo = 'Alessandro Vilas Boas - Vem Habitar (Clipe Oficial)'

  it('aceita quando o nome achado está no título original', () => {
    expect(achadoCombina('Vem Habitar', titulo)).toBe(true)
  })

  it('recusa outra música do mesmo artista', () => {
    expect(achadoCombina('Quero Conhecer Jesus', titulo)).toBe(false)
  })

  it('não se importa com acento, caixa nem subtítulo', () => {
    expect(achadoCombina('Lugar Secreto', 'LUGAR SECRETO | CLIPE OFICIAL | GABRIELA ROCHA')).toBe(true)
    expect(achadoCombina('Grato Sou (I Thank God)', 'Grato Sou - Ao vivo • DROPS')).toBe(true)
  })

  it('recusa nome vazio', () => {
    expect(achadoCombina('', titulo)).toBe(false)
  })
})

describe('precisaReconferir', () => {
  it('aceita o que foi conferido nesta semana', () => {
    expect(precisaReconferir('2026-09-08T10:00:00Z', new Date('2026-09-10T10:00:00Z'))).toBe(false)
  })

  it('manda reconferir o que passou de sete dias', () => {
    expect(precisaReconferir('2026-09-01T09:59:00Z', new Date('2026-09-08T10:00:00Z'))).toBe(true)
  })

  it('manda reconferir quando a data não presta', () => {
    expect(precisaReconferir('', new Date('2026-09-10T10:00:00Z'))).toBe(true)
  })
})

describe('TOM_ORIGINAL', () => {
  it('é uma palavra, não uma nota: o teclado não marca nada', () => {
    expect(partesDoTom(TOM_ORIGINAL)).toEqual({ nota: '', menor: false })
  })

  it('se escreve sozinho onde o Tom é impresso', () => {
    expect(`Tom ${TOM_ORIGINAL}`).toBe('Tom original')
  })
})
