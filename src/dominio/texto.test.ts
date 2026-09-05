import { describe, expect, it } from 'vitest'
import { medley, ministerioDeExemplo, trecho } from './exemplo'
import { descricaoDoItem, textoDeFinsDeSemana, textoParaWhatsApp } from './texto'
import { escalaPorId } from './escala'
import type { Ministerio } from './tipos'

const m = ministerioDeExemplo()

describe('descricaoDoItem', () => {
  it('descreve a Música inteira com o Tom', () => {
    expect(descricaoDoItem(m, escalaPorId(m, 'e0816').itens[0])).toBe('Meia Noite · Tom E')
  })

  it('descreve o Trecho com a minutagem', () => {
    expect(descricaoDoItem(m, escalaPorId(m, 'e0830').itens[2])).toBe('Sublime (2:10–4:35) · Tom A')
  })

  it('descreve o Medley com o Tom de cada Trecho', () => {
    const item = medley('i-med', [
      { musicaId: 'rio', tom: 'D', inicio: '0:30', fim: '1:40' },
      { musicaId: 'dono', tom: 'F', inicio: '2:00', fim: '3:10' },
    ])

    expect(descricaoDoItem(m, item)).toBe(
      'Medley: Rio (0:30–1:40, Tom D) + Dono da Minha Afeição (2:00–3:10, Tom F)',
    )
  })
})

describe('textoParaWhatsApp', () => {
  it('escreve título, Equipe por naipe, Repertório numerado com links e a playlist', () => {
    expect(textoParaWhatsApp(m, 'e0830')).toBe(
      [
        '*Culto de Domingo 18h · 30/08*',
        'Ministro: Isa',
        'Vocal: Ana, Bia (backing)',
        'Músicos: Gabriel (guitarra), Marcos (violão), Lucas (bateria)',
        'Som: Davi',
        '',
        'Repertório:',
        '1. Meia Noite · Tom G · Fhop Music',
        '   Obs: Começar mais baixo, diferente do clipe',
        '   https://youtu.be/hRJUcvsnqKs',
        '2. Em Teus Braços · Tom G · Laura Souguellis',
        '   https://youtu.be/IxpWNuxGmzc',
        '3. Sublime (2:10–4:35) · Tom A · Fhop Music',
        '   https://youtu.be/7GWZwO0MdsY?t=130',
        '',
        'Playlist pra ouvir em loop: https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,IxpWNuxGmzc',
      ].join('\n'),
    )
  })

  it('avisa quando ainda não há Equipe nem Repertório, e omite a playlist', () => {
    expect(textoParaWhatsApp(m, 'e0920')).toBe(
      ['*Culto de Domingo 18h · 20/09*', '(sem Equipe ainda)', '', 'Repertório:', '(ainda sem músicas)'].join('\n'),
    )
  })

  it('lista um link por Trecho do Medley', () => {
    const comMedley: Ministerio = {
      ...m,
      escalas: m.escalas.map((e) =>
        e.id === 'e0920'
          ? {
              ...e,
              itens: [
                medley('i-med', [
                  { musicaId: 'rio', tom: 'D', inicio: '0:30', fim: '1:40' },
                  { musicaId: 'dono', tom: 'F', inicio: '2:00', fim: '3:10' },
                ]),
              ],
            }
          : e,
      ),
    }

    expect(textoParaWhatsApp(comMedley, 'e0920')).toContain(
      ['1. Medley: Rio (0:30–1:40, Tom D) + Dono da Minha Afeição (2:00–3:10, Tom F)', '   https://youtu.be/s1oU-6vYc4E?t=30', '   https://youtu.be/2anDhu7L-Cc?t=120'].join('\n'),
    )
  })

  it('não põe playlist quando o Repertório só tem Trecho', () => {
    const soTrecho: Ministerio = {
      ...m,
      escalas: m.escalas.map((e) => (e.id === 'e0920' ? { ...e, itens: [trecho('i-t', 'rio', 'D', '0:30', '1:40')] } : e)),
    }

    expect(textoParaWhatsApp(soTrecho, 'e0920')).not.toContain('Playlist')
  })
})

describe('textoDeFinsDeSemana', () => {
  it('escreve por extenso, no singular e no plural', () => {
    expect(textoDeFinsDeSemana(5)).toBe('5 fins de semana seguidos')
    expect(textoDeFinsDeSemana(1)).toBe('1 fim de semana seguido')
    expect(textoDeFinsDeSemana(0)).toBeNull()
  })
})
