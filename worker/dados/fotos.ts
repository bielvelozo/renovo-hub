export type Foto = { mime: string; conteudo: ArrayBuffer | Uint8Array }

export async function lerFoto(db: D1Database, membroId: string): Promise<Foto | null> {
  const linha = await db
    .prepare('select mime, conteudo from fotos where membro_id = ?')
    .bind(membroId)
    .first<{ mime: string; conteudo: number[] }>()

  return linha ? { mime: linha.mime, conteudo: Uint8Array.from(linha.conteudo) } : null
}

export async function guardarFoto(db: D1Database, membroId: string, foto: Foto): Promise<string> {
  const em = new Date().toISOString()

  await db.batch([
    db
      .prepare('insert or replace into fotos (membro_id, mime, conteudo) values (?, ?, ?)')
      .bind(membroId, foto.mime, foto.conteudo),
    db.prepare('update membros set foto_em = ? where id = ?').bind(em, membroId),
  ])

  return em
}

export async function apagarFoto(db: D1Database, membroId: string): Promise<void> {
  await db.batch([
    db.prepare('delete from fotos where membro_id = ?').bind(membroId),
    db.prepare('update membros set foto_em = null where id = ?').bind(membroId),
  ])
}

export async function existeMembro(db: D1Database, id: string): Promise<boolean> {
  return !!(await db.prepare('select id from membros where id = ?').bind(id).first())
}
