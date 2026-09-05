import type { Escala, EstadoEscala, Funcao, GrupoEquipe, Item, Membro, Ministerio, Musica, Naipe } from './tipos'

export function membroPorId(m: Ministerio, id: string): Membro {
  const achado = m.membros.find((x) => x.id === id)
  if (!achado) throw new Error('Membro desconhecido: ' + id)
  return achado
}

export function musicaPorId(m: Ministerio, id: string): Musica {
  const achada = m.musicas.find((x) => x.id === id)
  if (!achada) throw new Error('Música desconhecida: ' + id)
  return achada
}

export function escalaPorId(m: Ministerio, id: string): Escala {
  const achada = m.escalas.find((x) => x.id === id)
  if (!achada) throw new Error('Escala desconhecida: ' + id)
  return achada
}

export function funcaoPorId(m: Ministerio, id: string): Funcao {
  const achada = m.funcoes.find((x) => x.id === id)
  if (!achada) throw new Error('Função desconhecida: ' + id)
  return achada
}

export function naipeDe(m: Ministerio, funcaoId: string): Naipe {
  return funcaoPorId(m, funcaoId).naipe
}

export function ehMusical(m: Ministerio, funcaoId: string): boolean {
  return naipeDe(m, funcaoId) !== 'tecnica'
}

export function estadoEscala(escala: Escala, hoje: string): EstadoEscala {
  if (escala.cancelada) return 'cancelada'
  return escala.data < hoje ? 'realizada' : 'agendada'
}

export function rotuloDoHorario(horario: string): string {
  return horario.endsWith(':00') ? horario.slice(0, 2) + 'h' : horario
}

export function tituloEscala(escala: Escala): string {
  return (escala.santaCeia ? 'Santa Ceia' : escala.rotulo) + ' ' + rotuloDoHorario(escala.horario)
}

export function ministros(escala: Escala): string[] {
  return escala.equipe.filter((x) => x.ministro).map((x) => x.membroId)
}

export function ministradoPorDe(escala: Escala, item?: Item | null): string | null {
  if (item?.ministradoPor) return item.ministradoPor
  const marcados = ministros(escala)
  return marcados.length === 1 ? marcados[0] : null
}

export function membrosMusicais(m: Ministerio, escala: Escala): string[] {
  return escala.equipe.filter((x) => x.funcoes.some((f) => ehMusical(m, f))).map((x) => x.membroId)
}

export function gruposEquipe(m: Ministerio, escala: Escala): GrupoEquipe[] {
  const nome = (id: string) => membroPorId(m, id).nome
  const nomeDaFuncao = (id: string) => funcaoPorId(m, id).nome.toLowerCase()
  const ordenadas = (funcoes: string[], naipe: Naipe) =>
    funcoes.filter((f) => naipeDe(m, f) === naipe).sort((a, b) => funcaoPorId(m, a).ordem - funcaoPorId(m, b).ordem)

  const marcados = escala.equipe.filter((x) => x.ministro)
  const resto = escala.equipe.filter((x) => !x.ministro)
  const grupos: GrupoEquipe[] = []

  if (marcados.length) {
    grupos.push({
      nome: marcados.length > 1 ? 'Ministros' : 'Ministro',
      itens: marcados.map((x) => {
        const instrumentos = ordenadas(x.funcoes, 'instrumentos')
        return nome(x.membroId) + (instrumentos.length ? ' (' + instrumentos.map(nomeDaFuncao).join(', ') + ')' : '')
      }),
    })
  }

  const vocal = resto.filter((x) => x.funcoes.some((f) => naipeDe(m, f) === 'vocal'))
  if (vocal.length) {
    grupos.push({
      nome: 'Vocal',
      itens: vocal.map((x) => nome(x.membroId) + (x.funcoes.includes('backing') ? ' (backing)' : '')),
    })
  }

  const musicos = resto.filter((x) => x.funcoes.some((f) => naipeDe(m, f) === 'instrumentos'))
  if (musicos.length) {
    grupos.push({
      nome: 'Músicos',
      itens: musicos.map((x) => nome(x.membroId) + ' (' + ordenadas(x.funcoes, 'instrumentos').map(nomeDaFuncao).join(', ') + ')'),
    })
  }

  const tecnica = resto.filter((x) => x.funcoes.some((f) => naipeDe(m, f) === 'tecnica'))
  if (tecnica.length) grupos.push({ nome: 'Som', itens: tecnica.map((x) => nome(x.membroId)) })

  return grupos
}
