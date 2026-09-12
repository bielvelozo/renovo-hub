export const CHAVE_SEMANAS_DE_REPETICAO = 'semanas_de_repeticao'
export const SEMANAS_DE_REPETICAO_PADRAO = 4
export const SEMANAS_DE_REPETICAO_ACEITAS = [2, 4, 6, 8]

export function ehSemanasDeRepeticao(valor: unknown): valor is number {
  return typeof valor === 'number' && SEMANAS_DE_REPETICAO_ACEITAS.includes(valor)
}

export async function lerSemanasDeRepeticao(db: D1Database): Promise<number> {
  const linha = await db
    .prepare('select valor from configuracoes where chave = ?')
    .bind(CHAVE_SEMANAS_DE_REPETICAO)
    .first<{ valor: string }>()

  const semanas = Number(linha?.valor)

  return ehSemanasDeRepeticao(semanas) ? semanas : SEMANAS_DE_REPETICAO_PADRAO
}

export async function definirSemanasDeRepeticao(db: D1Database, semanas: number): Promise<void> {
  await db
    .prepare('insert or replace into configuracoes (chave, valor) values (?, ?)')
    .bind(CHAVE_SEMANAS_DE_REPETICAO, String(semanas))
    .run()
}
