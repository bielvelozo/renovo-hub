export type TrechoNovo = {
  musicaId: string
  tom: string
  inicio: string
  fim: string
}

export type NovoItem =
  | { tipo: 'inteira'; musicaId: string; tom: string; observacao: string }
  | { tipo: 'trecho'; musicaId: string; tom: string; inicio: string; fim: string; observacao: string }
  | { tipo: 'medley'; trechos: TrechoNovo[]; observacao: string }

export type MarcasDoItem = {
  ministradoPor: string | null
  origemSugestaoId?: string | null
}

export type CamposDoItem = {
  tipo?: 'inteira' | 'trecho'
  tom?: string
  inicio?: string
  fim?: string
  observacao?: string
  ministradoPor?: string | null
}

export async function criarItem(
  db: D1Database,
  escalaId: string,
  novo: NovoItem,
  marcas: MarcasDoItem,
): Promise<string> {
  const id = crypto.randomUUID()
  const proxima = await proximaOrdem(db, escalaId)
  const inteiraOuTrecho = novo.tipo === 'medley' ? null : novo

  const comandos = [
    db
      .prepare(
        'insert into itens (id, escala_id, ordem, tipo, musica_id, tom, inicio, fim, observacao, ministrado_por, origem_sugestao_id, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id,
        escalaId,
        proxima,
        novo.tipo,
        inteiraOuTrecho?.musicaId ?? null,
        inteiraOuTrecho?.tom ?? null,
        inteiraOuTrecho && 'inicio' in inteiraOuTrecho ? inteiraOuTrecho.inicio : null,
        inteiraOuTrecho && 'fim' in inteiraOuTrecho ? inteiraOuTrecho.fim : null,
        novo.observacao,
        marcas.ministradoPor,
        marcas.origemSugestaoId ?? null,
        new Date().toISOString(),
      ),
    ...(novo.tipo === 'medley' ? comandosDeTrechos(db, id, novo.trechos) : []),
  ]

  await db.batch(comandos)

  return id
}

export async function atualizarItem(db: D1Database, itemId: string, campos: CamposDoItem): Promise<void> {
  const colunas: Record<string, string | null> = {}

  if (campos.tipo !== undefined) colunas.tipo = campos.tipo
  if (campos.tom !== undefined) colunas.tom = campos.tom
  if (campos.inicio !== undefined) colunas.inicio = campos.inicio
  if (campos.fim !== undefined) colunas.fim = campos.fim
  if (campos.observacao !== undefined) colunas.observacao = campos.observacao
  if (campos.ministradoPor !== undefined) colunas.ministrado_por = campos.ministradoPor

  if (campos.tipo === 'inteira') {
    colunas.inicio = null
    colunas.fim = null
  }

  const nomes = Object.keys(colunas)
  if (!nomes.length) return

  colunas.atualizado_em = new Date().toISOString()
  nomes.push('atualizado_em')

  await db
    .prepare(`update itens set ${nomes.map((nome) => nome + ' = ?').join(', ')} where id = ?`)
    .bind(...nomes.map((nome) => colunas[nome]), itemId)
    .run()
}

export async function trocarTrechos(db: D1Database, itemId: string, trechos: TrechoNovo[]): Promise<void> {
  await db.batch([
    db.prepare('delete from trechos where item_id = ?').bind(itemId),
    ...comandosDeTrechos(db, itemId, trechos),
    db.prepare('update itens set atualizado_em = ? where id = ?').bind(new Date().toISOString(), itemId),
  ])
}

export async function removerItem(db: D1Database, itemId: string): Promise<void> {
  await db.prepare('delete from itens where id = ?').bind(itemId).run()
}

export async function reordenarItens(db: D1Database, ids: string[]): Promise<void> {
  if (!ids.length) return

  await db.batch(
    ids.map((id, ordem) => db.prepare('update itens set ordem = ? where id = ?').bind(ordem, id)),
  )
}

function comandosDeTrechos(db: D1Database, itemId: string, trechos: TrechoNovo[]): D1PreparedStatement[] {
  return trechos.map((trecho, ordem) =>
    db
      .prepare('insert into trechos (id, item_id, ordem, musica_id, tom, inicio, fim) values (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), itemId, ordem, trecho.musicaId, trecho.tom, trecho.inicio, trecho.fim),
  )
}

async function proximaOrdem(db: D1Database, escalaId: string): Promise<number> {
  const linha = await db
    .prepare('select coalesce(max(ordem), -1) + 1 as proxima from itens where escala_id = ?')
    .bind(escalaId)
    .first<{ proxima: number }>()

  return linha?.proxima ?? 0
}
