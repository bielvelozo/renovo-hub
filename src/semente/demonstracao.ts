import { diaDaSemana, diasEntre, somarDias } from '../dominio'
import { inteira, medley, ministerioDeExemplo, trecho } from '../dominio/exemplo'
import type { EntradaEquipe, Escala, Item, Membro, Musica } from '../dominio/tipos'

const ESCALAS_DA_DEMONSTRACAO = ['e0816', 'e0823', 'e0830', 'e0913']

export const DATA_BASE_DA_DEMONSTRACAO = '2026-09-08'

const REPERTORIO_DA_AGENDADA: Item[] = [
  inteira('i10', 'fez-um-caminho', 'D'),
  inteira('i11', 'em-teus-bracos', 'G', 'Entrar direto, sem introdução'),
  trecho('i12', 'como-nao-te-amar', 'C', '1:05', '3:40'),
  medley(
    'i13',
    [
      { musicaId: 'rio', tom: 'D', inicio: '0:00', fim: '2:30' },
      { musicaId: 'dono', tom: 'E', inicio: '1:12', fim: '3:05' },
    ],
    'Emendar sem parar',
  ),
]

export function dataDeslocada(dataFixa: string, hoje: string): string {
  const semanas = Math.round(diasEntre(DATA_BASE_DA_DEMONSTRACAO, hoje) / 7)
  return somarDias(dataFixa, semanas * 7)
}

export function dadosDaDemonstracao(hoje: string): { membros: Membro[]; musicas: Musica[]; escalas: Escala[] } {
  const m = ministerioDeExemplo()

  const fixas = ESCALAS_DA_DEMONSTRACAO.map((id) => {
    const escala = m.escalas.find((e) => e.id === id)!
    const comItens = escala.itens.length ? escala : { ...escala, itens: REPERTORIO_DA_AGENDADA }

    return { ...comItens, data: foraDoDomingo(dataDeslocada(escala.data, hoje), hoje) }
  })

  return { membros: m.membros, musicas: m.musicas, escalas: [...fixas, ...escalasDeHoje(hoje)] }
}

// O smoke monta o mês seguinte com POST /api/escalas/mes e confere os domingos criados:
// uma Agendada de demonstração num domingo ocuparia o lugar de um deles.
function foraDoDomingo(data: string, hoje: string): string {
  return data >= hoje && diaDaSemana(data) === 0 ? somarDias(data, 1) : data
}

function escalasDeHoje(hoje: string): Escala[] {
  return [
    nova('d-ontem', somarDias(hoje, -1), 'Culto de ontem', '19:00', EQUIPE_DE_ONTEM, [
      inteira('i20', 'meia-noite', 'G'),
      inteira('i21', 'em-teus-bracos', 'G'),
      inteira('i22', 'grato', 'Bb'),
      inteira('i23', 'rio', 'D'),
      inteira('i24', 'dono', 'E'),
    ]),
    agendada('d-pronta', hoje, 3, 'Culto desta semana', EQUIPE_PRONTA, [
      inteira('i25', 'firme', 'C'),
      inteira('i26', 'sublime', 'A'),
    ]),
    agendada('d-sem-ministro', hoje, 5, 'Culto sem ministro', EQUIPE_SEM_MINISTRO, [
      inteira('i27', 'permanecerei', 'A'),
    ]),
    agendada('d-sem-bateria', hoje, 10, 'Culto sem baterista', EQUIPE_SEM_BATERIA, [
      inteira('i28', 'fez-um-caminho', 'D'),
    ]),
    agendada('d-sem-musicas', hoje, 12, 'Culto sem músicas', EQUIPE_PRONTA, []),
  ]
}

const EQUIPE_DE_ONTEM: EntradaEquipe[] = [
  { membroId: 'isa', funcoes: ['vocal'], ministro: true },
  { membroId: 'ana', funcoes: ['vocal'], ministro: false },
  { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
  { membroId: 'pedro', funcoes: ['baixo'], ministro: false },
  { membroId: 'lucas', funcoes: ['bateria'], ministro: false },
  { membroId: 'davi', funcoes: ['som'], ministro: false },
]

const EQUIPE_PRONTA: EntradaEquipe[] = [
  { membroId: 'marcos', funcoes: ['vocal', 'violao'], ministro: true },
  { membroId: 'bia', funcoes: ['vocal'], ministro: false },
  { membroId: 'gabriel', funcoes: ['guitarra'], ministro: false },
  { membroId: 'rafa', funcoes: ['baixo'], ministro: false },
  { membroId: 'lucas', funcoes: ['bateria'], ministro: false },
  { membroId: 'davi', funcoes: ['som'], ministro: false },
]

const EQUIPE_SEM_MINISTRO: EntradaEquipe[] = EQUIPE_PRONTA.map((entrada) => ({ ...entrada, ministro: false }))

const EQUIPE_SEM_BATERIA: EntradaEquipe[] = EQUIPE_PRONTA.filter((entrada) => entrada.membroId !== 'lucas')

function agendada(
  id: string,
  hoje: string,
  daquiADias: number,
  rotulo: string,
  equipe: EntradaEquipe[],
  itens: Item[],
): Escala {
  return nova(id, foraDoDomingo(somarDias(hoje, daquiADias), hoje), rotulo, '19:30', equipe, itens)
}

function nova(
  id: string,
  data: string,
  rotulo: string,
  horario: string,
  equipe: EntradaEquipe[],
  itens: Item[],
): Escala {
  return { id, data, horario, rotulo, santaCeia: false, cancelada: false, equipe, itens }
}
