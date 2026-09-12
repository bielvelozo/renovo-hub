import { lerSemanasDeRepeticao } from '../dados/configuracoes'
import { carregarMinisterio } from '../dados/ministerio'
import { apresentarEscala } from './escala'

// A memória do Item olha o histórico e as outras Escalas agendadas, então quem
// responde uma Escala carrega o ministério inteiro, não só ela.
export async function responderEscala(db: D1Database, id: string) {
  const [m, semanas] = await Promise.all([carregarMinisterio(db), lerSemanasDeRepeticao(db)])
  const escala = m.escalas.find((x) => x.id === id)

  return escala ? apresentarEscala(m, escala, semanas) : null
}
