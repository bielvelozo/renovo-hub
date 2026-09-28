import { describe, expect, it } from 'vitest'
import { IDS_DAS_TAREFAS, TAREFAS, avancar, contarFeitas, ehTarefa, gruposDoGuia, tarefasDoInicio } from './tarefas'

describe('tarefasDoInicio', () => {
  it('mostra ao Membro o que ele usa: conferir, ler, culto, sugerir e catálogo', () => {
    expect(tarefasDoInicio(false).map((tarefa) => tarefa.id)).toEqual([
      'conferir-escala',
      'ler-letra',
      'modo-culto',
      'sugerir',
      'catalogo',
    ])
  })

  it('mostra a quem dirige o trabalho da semana, terminando no modo culto', () => {
    expect(tarefasDoInicio(true).map((tarefa) => tarefa.id)).toEqual([
      'criar-escalas',
      'montar-equipe',
      'adicionar-musica',
      'medley',
      'letra',
      'promover',
      'modo-culto',
    ])
  })
})

describe('gruposDoGuia', () => {
  it('dá ao Membro só o grupo de todos', () => {
    expect(gruposDoGuia(false).map((grupo) => grupo.titulo)).toEqual(['Para todos'])
  })

  it('dá a quem dirige os dois grupos, sem repetir o modo culto', () => {
    const grupos = gruposDoGuia(true)
    const ids = grupos.flatMap((grupo) => grupo.tarefas.map((tarefa) => tarefa.id))

    expect(grupos.map((grupo) => grupo.titulo)).toEqual(['Para quem dirige', 'Para todos'])
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(IDS_DAS_TAREFAS.length)
  })
})

describe('contarFeitas', () => {
  it('conta só as feitas entre as tarefas mostradas', () => {
    expect(contarFeitas(tarefasDoInicio(false), ['sugerir', 'medley', 'catalogo'])).toBe(2)
  })
})

describe('avancar', () => {
  it('vai pro passo seguinte e termina depois do último', () => {
    const ultimo = TAREFAS.sugerir.passos.length - 1

    expect(avancar({ tarefa: 'sugerir', passo: 0 })).toEqual({ tarefa: 'sugerir', passo: 1 })
    expect(avancar({ tarefa: 'sugerir', passo: ultimo })).toBeNull()
  })
})

describe('ehTarefa', () => {
  it('reconhece só as tarefas do guia', () => {
    expect(ehTarefa('medley')).toBe(true)
    expect(ehTarefa('voar')).toBe(false)
    expect(ehTarefa(3)).toBe(false)
  })

  it('toda tarefa tem passos e passos de rota têm o caminho', () => {
    for (const id of IDS_DAS_TAREFAS) {
      const tarefa = TAREFAS[id]
      expect(tarefa.id).toBe(id)
      expect(tarefa.passos.length).toBeGreaterThan(0)
      for (const passo of tarefa.passos) if (passo.avanco === 'rota') expect(passo.rota).toBeInstanceOf(RegExp)
    }
  })
})
