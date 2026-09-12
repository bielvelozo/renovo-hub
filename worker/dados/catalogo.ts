import type { ContextoDoCatalogo } from '../http/musica'
import { musicasComLetra } from './anexos'
import { lerSemanasDeRepeticao } from './configuracoes'

export async function lerContextoDoCatalogo(db: D1Database, escalaId?: string): Promise<ContextoDoCatalogo> {
  const [semanas, comLetra] = await Promise.all([lerSemanasDeRepeticao(db), musicasComLetra(db)])

  return { semanas, comLetra, escalaId }
}
