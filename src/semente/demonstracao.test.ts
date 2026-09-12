import { describe, expect, it } from 'vitest'
import { diaDaSemana, estadoEscala, somarDias } from '../dominio'
import { pendenciasDaEscala } from '../dominio/pendencias'
import { FUNCOES } from '../dominio/exemplo'
import { DATA_BASE_DA_DEMONSTRACAO, dadosDaDemonstracao, dataDeslocada } from './demonstracao'
import type { Ministerio } from '../dominio'

const HOJES = ['2026-09-12', '2026-09-08', '2026-10-31', '2027-01-03', '2027-02-24']

function ministerio(hoje: string): Ministerio {
  const dados = dadosDaDemonstracao(hoje)
  return { hoje, funcoes: FUNCOES, membros: dados.membros, musicas: dados.musicas, escalas: dados.escalas }
}

describe('deslocamento das datas da demonstração', () => {
  it('anda de semana em semana, preservando o dia da semana', () => {
    expect(dataDeslocada('2026-08-16', DATA_BASE_DA_DEMONSTRACAO)).toBe('2026-08-16')
    expect(dataDeslocada('2026-08-16', '2026-09-12')).toBe('2026-08-23')
    expect(dataDeslocada('2026-08-16', '2026-10-06')).toBe('2026-09-13')

    for (const hoje of HOJES) {
      expect(diaDaSemana(dataDeslocada('2026-08-16', hoje))).toBe(0)
    }
  })

  it('mantém três Escalas Realizadas e uma Agendada entre as fixas', () => {
    for (const hoje of HOJES) {
      const m = ministerio(hoje)
      const fixas = m.escalas.filter((escala) => escala.id.startsWith('e'))

      expect(fixas.filter((escala) => estadoEscala(escala, hoje) === 'realizada')).toHaveLength(3)
      expect(fixas.filter((escala) => estadoEscala(escala, hoje) === 'agendada')).toHaveLength(1)
    }
  })

  it('nenhuma Escala Agendada da demonstração cai num domingo', () => {
    for (const hoje of HOJES) {
      const m = ministerio(hoje)
      const emDomingo = m.escalas.filter(
        (escala) => estadoEscala(escala, hoje) === 'agendada' && diaDaSemana(escala.data) === 0,
      )

      expect(emDomingo.map((escala) => `${escala.id} em ${escala.data}`)).toEqual([])
    }
  })

  it('põe o culto de ontem com cinco músicas, pro cartão pós-culto', () => {
    for (const hoje of HOJES) {
      const ontem = ministerio(hoje).escalas.find((escala) => escala.rotulo === 'Culto de ontem')!

      expect(ontem.data).toBe(somarDias(hoje, -1))
      expect(ontem.horario).toBe('19:00')
      expect(ontem.itens).toHaveLength(5)
      expect(ontem.equipe.filter((entrada) => entrada.ministro).map((entrada) => entrada.membroId)).toEqual(['isa'])
    }
  })

  it('traz uma Agendada pronta e uma de cada pendência', () => {
    const m = ministerio('2026-09-12')
    const chaves = (id: string) =>
      pendenciasDaEscala(m, m.escalas.find((escala) => escala.id === id)!).pendencias.map((p) => p.chave)

    expect(chaves('d-pronta')).toEqual([])
    expect(chaves('d-sem-ministro')).toEqual(['sem-ministro'])
    expect(chaves('d-sem-bateria')).toEqual(['falta-funcao'])
    expect(chaves('d-sem-musicas')).toEqual(['sem-musicas'])
  })
})
