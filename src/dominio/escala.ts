import type {
  EntradaDaFormacao,
  EntradaEquipe,
  Escala,
  EstadoEscala,
  Funcao,
  GrupoEquipe,
  Item,
  Membro,
  Ministerio,
  Musica,
  Grupo,
} from './tipos'

export const GRUPOS: Grupo[] = ['vocal', 'instrumentos', 'tecnica']

export type PessoaDaEquipe = {
  membroId: string
  nome: string
  funcoes: string[]
  ministro: boolean
  grupo?: Grupo | null
}

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

export function grupoDe(m: Ministerio, funcaoId: string): Grupo {
  return funcaoPorId(m, funcaoId).grupo
}

export function ehMusical(m: Ministerio, funcaoId: string): boolean {
  return grupoDe(m, funcaoId) !== 'tecnica'
}

export function daFormacao(m: Ministerio, equipe: EntradaEquipe[]): EntradaDaFormacao[] {
  return equipe
    .map((entrada) => ({
      membroId: entrada.membroId,
      funcoes: entrada.funcoes.filter((funcaoId) => grupoDe(m, funcaoId) === 'instrumentos'),
    }))
    .filter((entrada) => entrada.funcoes.length > 0)
}

export function unicoDoSom(m: Ministerio): EntradaEquipe | null {
  const candidatos = m.membros.filter(
    (membro) => !membro.inativo && membro.funcoes.some((funcaoId) => grupoDe(m, funcaoId) === 'tecnica'),
  )

  if (candidatos.length !== 1) return null

  const membro = candidatos[0]

  return {
    membroId: membro.id,
    funcoes: membro.funcoes.filter((funcaoId) => grupoDe(m, funcaoId) === 'tecnica'),
    ministro: false,
  }
}

export function estadoEscala(escala: Escala, hoje: string): EstadoEscala {
  if (escala.cancelada) return 'cancelada'
  return escala.data < hoje ? 'realizada' : 'agendada'
}

export function rotuloDoHorario(horario: string): string {
  return horario.endsWith(':00') ? horario.slice(0, 2) + 'h' : horario
}

export function nomeDaEscala(escala: Pick<Escala, 'rotulo' | 'santaCeia'>): string {
  return escala.santaCeia ? 'Santa Ceia' : escala.rotulo
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

export function musicasDoItem(item: Item): string[] {
  if (item.tipo !== 'medley') return [item.musicaId]
  return [...new Set(item.trechos.map((trecho) => trecho.musicaId))]
}

export function membrosMusicais(m: Ministerio, escala: Escala): string[] {
  return escala.equipe.filter((x) => x.funcoes.some((f) => ehMusical(m, f))).map((x) => x.membroId)
}

export function pessoasDaEquipe(m: Ministerio, escala: Escala): PessoaDaEquipe[] {
  return escala.equipe
    .map((entrada) => {
      const funcoes = funcoesEmOrdem(m, entrada.funcoes)

      return {
        pessoa: {
          membroId: entrada.membroId,
          nome: membroPorId(m, entrada.membroId).nome,
          funcoes: funcoes.map((funcao) => funcao.nome),
          ministro: entrada.ministro,
          grupo: funcoes.length ? funcoes[0].grupo : null,
        },
        peso: funcoes.length ? [GRUPOS.indexOf(funcoes[0].grupo), funcoes[0].ordem] : [GRUPOS.length, 0],
      }
    })
    .sort(
      (a, b) =>
        Number(b.pessoa.ministro) - Number(a.pessoa.ministro) ||
        a.peso[0] - b.peso[0] ||
        a.peso[1] - b.peso[1] ||
        a.pessoa.nome.localeCompare(b.pessoa.nome),
    )
    .map(({ pessoa }) => pessoa)
}

function funcoesEmOrdem(m: Ministerio, funcoes: string[]): Funcao[] {
  return funcoes
    .map((id) => funcaoPorId(m, id))
    .sort(
      (a, b) =>
        GRUPOS.indexOf(a.grupo) - GRUPOS.indexOf(b.grupo) || a.ordem - b.ordem || a.nome.localeCompare(b.nome),
    )
}

export function gruposEquipe(m: Ministerio, escala: Escala): GrupoEquipe[] {
  const nome = (id: string) => membroPorId(m, id).nome
  const nomeDaFuncao = (id: string) => funcaoPorId(m, id).nome.toLowerCase()
  const ordenadas = (funcoes: string[], grupo: Grupo) =>
    funcoes.filter((f) => grupoDe(m, f) === grupo).sort((a, b) => funcaoPorId(m, a).ordem - funcaoPorId(m, b).ordem)

  const marcados = escala.equipe.filter((x) => x.ministro)
  const resto = escala.equipe.filter((x) => !x.ministro)
  const grupos: GrupoEquipe[] = []

  if (marcados.length) {
    grupos.push({
      nome: marcados.length > 1 ? 'Ministros' : 'Ministro',
      itens: marcados.map((x) => {
        const funcoes = [...ordenadas(x.funcoes, 'vocal'), ...ordenadas(x.funcoes, 'instrumentos'), ...ordenadas(x.funcoes, 'tecnica')]
        return nome(x.membroId) + (funcoes.length ? ' (' + funcoes.map(nomeDaFuncao).join(', ') + ')' : '')
      }),
    })
  }

  const vocal = resto.filter((x) => x.funcoes.some((f) => grupoDe(m, f) === 'vocal'))
  if (vocal.length) {
    grupos.push({
      nome: 'Vocal',
      itens: vocal.map((x) => nome(x.membroId)),
    })
  }

  const musicos = resto.filter((x) => x.funcoes.some((f) => grupoDe(m, f) === 'instrumentos'))
  if (musicos.length) {
    grupos.push({
      nome: 'Músicos',
      itens: musicos.map((x) => nome(x.membroId) + ' (' + ordenadas(x.funcoes, 'instrumentos').map(nomeDaFuncao).join(', ') + ')'),
    })
  }

  const tecnica = resto.filter((x) => x.funcoes.some((f) => grupoDe(m, f) === 'tecnica'))
  if (tecnica.length) grupos.push({ nome: 'Som', itens: tecnica.map((x) => nome(x.membroId)) })

  return grupos
}
