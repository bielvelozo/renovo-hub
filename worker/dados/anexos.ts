export type Anexo = {
  id: string
  musicaId: string
  nome: string
  mime: string
  tamanho: number
  versao: number
  criadoEm: string
  url: string
}

export type NovoAnexo = {
  nome: string
  mime: string
  conteudo: ArrayBuffer
}

type LinhaDeAnexo = {
  id: string
  musica_id: string
  nome: string
  mime: string
  tamanho: number
  versao: number
  criado_em: string
}

export async function criarAnexo(db: D1Database, musicaId: string, novo: NovoAnexo): Promise<string> {
  const id = crypto.randomUUID()
  const proxima = await proximaVersao(db, musicaId)

  await db
    .prepare(
      'insert into anexos (id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em) values (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, musicaId, novo.nome, novo.mime, novo.conteudo.byteLength, novo.conteudo, proxima, new Date().toISOString())
    .run()

  return id
}

export async function lerAnexos(db: D1Database, musicaId: string): Promise<Anexo[]> {
  const { results } = await db
    .prepare(
      'select id, musica_id, nome, mime, tamanho, versao, criado_em from anexos where musica_id = ? order by versao desc',
    )
    .bind(musicaId)
    .all<LinhaDeAnexo>()

  return results.map(montar)
}

export async function lerAnexo(db: D1Database, id: string): Promise<Anexo | null> {
  const linha = await db
    .prepare('select id, musica_id, nome, mime, tamanho, versao, criado_em from anexos where id = ?')
    .bind(id)
    .first<LinhaDeAnexo>()

  return linha ? montar(linha) : null
}

// O D1 devolve BLOB como array de bytes, não como ArrayBuffer.
export async function lerConteudo(db: D1Database, id: string): Promise<Uint8Array | null> {
  const linha = await db
    .prepare('select conteudo from anexos where id = ?')
    .bind(id)
    .first<{ conteudo: number[] }>()

  return linha ? Uint8Array.from(linha.conteudo) : null
}

function montar(linha: LinhaDeAnexo): Anexo {
  return {
    id: linha.id,
    musicaId: linha.musica_id,
    nome: linha.nome,
    mime: linha.mime,
    tamanho: linha.tamanho,
    versao: linha.versao,
    criadoEm: linha.criado_em,
    url: '/api/anexos/' + linha.id,
  }
}

async function proximaVersao(db: D1Database, musicaId: string): Promise<number> {
  const linha = await db
    .prepare('select coalesce(max(versao), 0) + 1 as proxima from anexos where musica_id = ?')
    .bind(musicaId)
    .first<{ proxima: number }>()

  return linha?.proxima ?? 1
}
