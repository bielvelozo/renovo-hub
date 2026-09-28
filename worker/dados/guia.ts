export type Guia = { feitas: string[]; escondido: boolean }

export async function lerGuia(db: D1Database, membroId: string): Promise<Guia> {
  const [feitas, membro] = await db.batch([
    db.prepare('select tarefa from guia_feitas where membro_id = ? order by tarefa').bind(membroId),
    db.prepare('select guia_escondido from membros where id = ?').bind(membroId),
  ])

  return {
    feitas: (feitas.results as { tarefa: string }[]).map((linha) => linha.tarefa),
    escondido: (membro.results as { guia_escondido: number }[])[0]?.guia_escondido === 1,
  }
}

export async function marcarFeita(db: D1Database, membroId: string, tarefa: string): Promise<void> {
  await db
    .prepare('insert into guia_feitas (membro_id, tarefa, feita_em) values (?, ?, ?) on conflict do nothing')
    .bind(membroId, tarefa, new Date().toISOString())
    .run()
}

export async function definirEscondido(db: D1Database, membroId: string, escondido: boolean): Promise<void> {
  await db.prepare('update membros set guia_escondido = ? where id = ?').bind(escondido ? 1 : 0, membroId).run()
}
