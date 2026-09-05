import { describe, expect, it } from 'vitest'
import { medley, ministerioDeExemplo } from './exemplo'
import { cobertura, ehLegado, execucoes, historicoDaMusica, ultimaExecucao, ultimoTom } from './execucoes'
import { musicaPorId } from './escala'
import type { Ministerio } from './tipos'

const comEscala = (m: Ministerio, id: string, muda: (e: Ministerio['escalas'][number]) => Ministerio['escalas'][number]): Ministerio => ({
  ...m,
  escalas: m.escalas.map((e) => (e.id === id ? muda(e) : e)),
})

describe('execucoes', () => {
  it('deriva uma Execução por Item de Escala Realizada, da mais nova pra mais velha', () => {
    const feitas = execucoes(ministerioDeExemplo())

    expect(feitas).toHaveLength(9)
    expect(feitas[0].data).toBe('2026-09-06')
    expect(feitas.at(-1)?.data).toBe('2026-08-16')
  })

  it('não gera Execução de Escala Agendada', () => {
    const m = ministerioDeExemplo()
    const comRepertorio = comEscala(m, 'e0913', (e) => ({ ...e, itens: m.escalas[0].itens }))

    expect(execucoes(comRepertorio).some((x) => x.escalaId === 'e0913')).toBe(false)
  })

  it('não gera Execução de Escala Cancelada', () => {
    const cancelada = comEscala(ministerioDeExemplo(), 'e0816', (e) => ({ ...e, cancelada: true }))

    expect(execucoes(cancelada).some((x) => x.escalaId === 'e0816')).toBe(false)
    expect(execucoes(cancelada)).toHaveLength(7)
  })

  it('credita só quem tem Função musical: a técnica entra na Equipe e fica fora do quem já tocou', () => {
    const primeira = execucoes(ministerioDeExemplo()).find((x) => x.escalaId === 'e0816')

    expect(primeira?.membros).toEqual(['marcos', 'gabriel', 'pedro', 'ana', 'lucas'])
    expect(primeira?.membros).not.toContain('davi')
  })

  it('marca como parcial a Execução vinda de Trecho e como inteira a da Música toda', () => {
    const feitas = execucoes(ministerioDeExemplo())

    expect(feitas.find((x) => x.musicaId === 'sublime')?.parcial).toBe(true)
    expect(feitas.find((x) => x.musicaId === 'firme')?.parcial).toBe(false)
  })

  it('gera uma Execução parcial por Trecho do Medley, cada uma com o Tom do seu Trecho', () => {
    const m = comEscala(ministerioDeExemplo(), 'e0816', (e) => ({
      ...e,
      itens: [
        medley('i-med', [
          { musicaId: 'rio', tom: 'D', inicio: '0:30', fim: '1:40' },
          { musicaId: 'dono', tom: 'F', inicio: '2:00', fim: '3:10' },
        ]),
      ],
    }))
    const doMedley = execucoes(m).filter((x) => x.escalaId === 'e0816')

    expect(doMedley).toHaveLength(2)
    expect(doMedley.every((x) => x.parcial)).toBe(true)
    expect(doMedley.map((x) => [x.musicaId, x.tom])).toEqual([
      ['rio', 'D'],
      ['dono', 'F'],
    ])
  })

  it('carrega o ministrado por do Item em cada Execução', () => {
    expect(execucoes(ministerioDeExemplo()).find((x) => x.musicaId === 'firme')?.ministradoPor).toBe('marcos')
  })
})

describe('ultimoTom', () => {
  it('prefere o Tom da última Execução, mesmo quando a Música tem tom conhecido à mão', () => {
    const sugerido = ultimoTom(ministerioDeExemplo(), 'meia-noite')

    expect(sugerido).toMatchObject({ tom: 'G', origem: 'execucao', data: '2026-08-30', parcial: false })
  })

  it('aceita Execução parcial como origem do último Tom', () => {
    expect(ultimoTom(ministerioDeExemplo(), 'sublime')).toMatchObject({ tom: 'A', origem: 'execucao', parcial: true })
  })

  it('cai pro tom conhecido à mão quando não houve Execução', () => {
    const m = ministerioDeExemplo()
    const semExecucoes: Ministerio = { ...m, escalas: [] }

    expect(ultimoTom(semExecucoes, 'grato')).toMatchObject({ tom: 'Bb', origem: 'conhecido' })
  })

  it('cai pro tom original da gravação quando não há Execução nem tom à mão', () => {
    const m: Ministerio = { ...ministerioDeExemplo(), escalas: [] }

    expect(ultimoTom(m, 'rio')).toMatchObject({ tom: 'D', origem: 'original' })
  })

  it('devolve nulo quando a Música não tem Tom nenhum', () => {
    const m = ministerioDeExemplo()
    const semTom: Ministerio = {
      ...m,
      escalas: [],
      musicas: m.musicas.map((x) => (x.id === 'rio' ? { ...x, tomOriginal: null } : x)),
    }

    expect(ultimoTom(semTom, 'rio')).toBeNull()
  })
})

describe('historicoDaMusica e ultimaExecucao', () => {
  it('lista as Execuções da Música da mais nova pra mais velha', () => {
    expect(historicoDaMusica(ministerioDeExemplo(), 'meia-noite').map((x) => x.data)).toEqual([
      '2026-08-30',
      '2026-08-16',
    ])
  })

  it('devolve nulo quando a Música nunca foi tocada', () => {
    expect(ultimaExecucao(ministerioDeExemplo(), 'rio')).toBeNull()
  })
})

describe('ehLegado', () => {
  it('mantém Legado a Música importada que nunca foi tocada', () => {
    const m = ministerioDeExemplo()

    expect(ehLegado(m, musicaPorId(m, 'rio'))).toBe(true)
  })

  it('tira o Legado na primeira Execução, mesmo que parcial', () => {
    const m = ministerioDeExemplo()

    expect(ehLegado(m, musicaPorId(m, 'sublime'))).toBe(false)
  })
})

describe('cobertura', () => {
  it('separa quem da Equipe já tocou a Música de quem nunca tocou, sem contar a técnica', () => {
    const m = ministerioDeExemplo()

    expect(cobertura(m, 'e0913', 'grato')).toEqual({
      ja: ['Isa', 'Gabriel', 'Lucas'],
      nunca: ['Pedro', 'Ana'],
    })
    expect(cobertura(m, 'e0913', 'grato').ja).not.toContain('Davi')
  })

  it('devolve todo mundo como nunca quando a Música não tem Execução', () => {
    expect(cobertura(ministerioDeExemplo(), 'e0913', 'rio')).toEqual({
      ja: [],
      nunca: ['Isa', 'Gabriel', 'Pedro', 'Ana', 'Lucas'],
    })
  })
})
