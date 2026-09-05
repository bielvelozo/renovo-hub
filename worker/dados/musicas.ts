export type NovaMusica = {
  titulo: string
  artista: string
  videoId: string
  tomConhecido: string | null
  tomOriginal: string | null
}

export type CamposDaMusica = {
  titulo?: string
  artista?: string
  tomConhecido?: string | null
  tomOriginal?: string | null
  revisar?: boolean
}

export async function criarMusica(db: D1Database, nova: NovaMusica): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      'insert into musicas (id, titulo, artista, video_id, legado, tom_conhecido, tom_original, arquivada, revisar, criado_em) values (?, ?, ?, ?, 0, ?, ?, 0, 0, ?)',
    )
    .bind(id, nova.titulo, nova.artista, nova.videoId, nova.tomConhecido, nova.tomOriginal, new Date().toISOString())
    .run()

  return id
}

export async function atualizarMusica(db: D1Database, id: string, campos: CamposDaMusica): Promise<void> {
  const colunas: Record<string, string | number | null> = {}

  if (campos.titulo !== undefined) colunas.titulo = campos.titulo
  if (campos.artista !== undefined) colunas.artista = campos.artista
  if (campos.tomConhecido !== undefined) colunas.tom_conhecido = campos.tomConhecido
  if (campos.tomOriginal !== undefined) colunas.tom_original = campos.tomOriginal
  if (campos.revisar !== undefined) colunas.revisar = campos.revisar ? 1 : 0

  const nomes = Object.keys(colunas)
  if (!nomes.length) return

  await db
    .prepare(`update musicas set ${nomes.map((nome) => nome + ' = ?').join(', ')} where id = ?`)
    .bind(...nomes.map((nome) => colunas[nome]), id)
    .run()
}

export async function definirArquivada(db: D1Database, id: string, arquivada: boolean): Promise<void> {
  await db
    .prepare('update musicas set arquivada = ? where id = ?')
    .bind(arquivada ? 1 : 0, id)
    .run()
}

export async function apagarMusica(db: D1Database, id: string): Promise<void> {
  await db.prepare('delete from musicas where id = ?').bind(id).run()
}

export async function musicaPorVideo(db: D1Database, videoId: string): Promise<string | null> {
  const linha = await db
    .prepare('select id from musicas where video_id = ?')
    .bind(videoId)
    .first<{ id: string }>()

  return linha?.id ?? null
}

export async function estaEmAlgumRepertorio(db: D1Database, musicaId: string): Promise<boolean> {
  const linha = await db
    .prepare(
      'select (select count(*) from itens where musica_id = ?1) + (select count(*) from trechos where musica_id = ?1) as usos',
    )
    .bind(musicaId)
    .first<{ usos: number }>()

  return (linha?.usos ?? 0) > 0
}
