export type EntradaDaFormacao = {
  membroId: string
  funcoes: string[]
}

export type Formacao = {
  id: string
  nome: string
  entradas: EntradaDaFormacao[]
}

export async function lerFormacoes(db: D1Database): Promise<Formacao[]> {
  const { results } = await db.prepare('select id, nome from formacoes order by nome').all<{
    id: string
    nome: string
  }>()

  const { results: entradas } = await db
    .prepare(
      'select fe.formacao_id, fe.membro_id, fe.funcao_id from formacao_entradas fe join funcoes f on f.id = fe.funcao_id order by f.ordem, f.nome',
    )
    .all<{ formacao_id: string; membro_id: string; funcao_id: string }>()

  return results.map((linha) => {
    const minhas = entradas.filter((entrada) => entrada.formacao_id === linha.id)
    const membros = [...new Set(minhas.map((entrada) => entrada.membro_id))]

    return {
      id: linha.id,
      nome: linha.nome,
      entradas: membros.map((membroId) => ({
        membroId,
        funcoes: minhas.filter((entrada) => entrada.membro_id === membroId).map((entrada) => entrada.funcao_id),
      })),
    }
  })
}

export async function lerFormacao(db: D1Database, id: string): Promise<Formacao | null> {
  return (await lerFormacoes(db)).find((formacao) => formacao.id === id) ?? null
}

export async function criarFormacao(db: D1Database, nome: string, entradas: EntradaDaFormacao[]): Promise<string> {
  const id = crypto.randomUUID()

  await db.prepare('insert into formacoes (id, nome) values (?, ?)').bind(id, nome).run()
  await gravarEntradas(db, id, entradas)

  return id
}

export async function renomearFormacao(db: D1Database, id: string, nome: string): Promise<void> {
  await db.prepare('update formacoes set nome = ? where id = ?').bind(nome, id).run()
}

export async function trocarEntradas(db: D1Database, id: string, entradas: EntradaDaFormacao[]): Promise<void> {
  await db.prepare('delete from formacao_entradas where formacao_id = ?').bind(id).run()
  await gravarEntradas(db, id, entradas)
}

async function gravarEntradas(db: D1Database, id: string, entradas: EntradaDaFormacao[]): Promise<void> {
  const comandos = entradas.flatMap((entrada) =>
    entrada.funcoes.map((funcaoId) =>
      db
        .prepare('insert or ignore into formacao_entradas (formacao_id, membro_id, funcao_id) values (?, ?, ?)')
        .bind(id, entrada.membroId, funcaoId),
    ),
  )

  if (comandos.length) await db.batch(comandos)
}
