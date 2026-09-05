import { inteira, medley, ministerioDeExemplo, trecho } from '../dominio/exemplo'
import type { Escala, Item, Membro, Musica } from '../dominio/tipos'

const ESCALAS_DA_DEMONSTRACAO = ['e0816', 'e0823', 'e0830', 'e0913']

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

export function dadosDaDemonstracao(): { membros: Membro[]; musicas: Musica[]; escalas: Escala[] } {
  const m = ministerioDeExemplo()

  const escalas = ESCALAS_DA_DEMONSTRACAO.map((id) => {
    const escala = m.escalas.find((e) => e.id === id)!
    return escala.itens.length ? escala : { ...escala, itens: REPERTORIO_DA_AGENDADA }
  })

  return { membros: m.membros, musicas: m.musicas, escalas }
}
