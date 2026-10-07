import { musicasDoItem } from '../../src/dominio'
import { anexosPorDono, lerAnexosDeItens, lerAnexosDeMusicas } from '../dados/anexos'
import { lerSemanasDeRepeticao } from '../dados/configuracoes'
import { carregarMinisterio } from '../dados/ministerio'
import { apresentarEscala } from './escala'

export async function responderEscala(db: D1Database, id: string) {
  const [m, semanas] = await Promise.all([carregarMinisterio(db), lerSemanasDeRepeticao(db)])
  const escala = m.escalas.find((x) => x.id === id)
  if (!escala) return null

  const musicas = [...new Set(escala.itens.flatMap(musicasDoItem))]
  const itens = escala.itens.filter((item) => item.tipo === 'medley').map((item) => item.id)

  const [deMusicas, deItens] = await Promise.all([
    lerAnexosDeMusicas(db, musicas),
    lerAnexosDeItens(db, itens),
  ])

  return {
    ...apresentarEscala(m, escala, semanas),
    anexosPorDono: anexosPorDono([...deMusicas, ...deItens]),
  }
}
