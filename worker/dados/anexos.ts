import { chaveDoItem } from '../../src/api/anexos'
import type { Letra } from '../../src/dominio'

export type DonoDoAnexo = { musicaId: string } | { itemId: string }

export type Anexo = {
  id: string
  musicaId: string | null
  itemId: string | null
  nome: string
  mime: string
  tamanho: number
  temLetra: boolean
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
  musica_id: string | null
  item_id: string | null
  nome: string
  mime: string
  tamanho: number
  tem_letra: number
  versao: number
  criado_em: string
}

const CAMPOS = 'id, musica_id, item_id, nome, mime, tamanho, letra is not null as tem_letra, versao, criado_em'

export async function criarAnexo(
  db: D1Database,
  dono: DonoDoAnexo,
  novo: NovoAnexo & { letra: Letra },
): Promise<string> {
  const id = crypto.randomUUID()
  const [coluna, donoId] = colunaDoDono(dono)
  const proxima = await proximaVersao(db, dono)

  await db
    .prepare(
      `insert into anexos (id, ${coluna}, nome, mime, tamanho, conteudo, letra, versao, criado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      donoId,
      novo.nome,
      novo.mime,
      novo.conteudo.byteLength,
      novo.conteudo,
      JSON.stringify(novo.letra),
      proxima,
      new Date().toISOString(),
    )
    .run()

  return id
}

export async function lerAnexosDoDono(db: D1Database, dono: DonoDoAnexo): Promise<Anexo[]> {
  const [coluna, donoId] = colunaDoDono(dono)
  const { results } = await db
    .prepare(`select ${CAMPOS} from anexos where ${coluna} = ? order by versao desc`)
    .bind(donoId)
    .all<LinhaDeAnexo>()

  return results.map(montar)
}

export async function lerAnexosDeMusicas(db: D1Database, musicaIds: string[]): Promise<Anexo[]> {
  return lerAnexosDe(db, 'musica_id', musicaIds)
}

export async function lerAnexosDeItens(db: D1Database, itemIds: string[]): Promise<Anexo[]> {
  return lerAnexosDe(db, 'item_id', itemIds)
}

export async function musicasComLetra(db: D1Database): Promise<Set<string>> {
  const { results } = await db
    .prepare('select musica_id from anexos where musica_id is not null and letra is not null group by musica_id')
    .all<{ musica_id: string }>()

  return new Set(results.map((linha) => linha.musica_id))
}

export async function lerAnexo(db: D1Database, id: string): Promise<Anexo | null> {
  const linha = await db.prepare(`select ${CAMPOS} from anexos where id = ?`).bind(id).first<LinhaDeAnexo>()

  return linha ? montar(linha) : null
}

export async function lerLetra(db: D1Database, anexoId: string): Promise<Letra | null> {
  const linha = await db
    .prepare('select letra from anexos where id = ?')
    .bind(anexoId)
    .first<{ letra: string | null }>()

  return desfazerLetra(linha?.letra ?? null)
}

export async function letraMaisNova(db: D1Database, dono: DonoDoAnexo): Promise<Letra | null> {
  const [coluna, donoId] = colunaDoDono(dono)
  const linha = await db
    .prepare(`select letra from anexos where ${coluna} = ? and letra is not null order by versao desc limit 1`)
    .bind(donoId)
    .first<{ letra: string }>()

  return desfazerLetra(linha?.letra ?? null)
}

export async function letrasMaisNovas(
  db: D1Database,
): Promise<{ porMusica: Record<string, Letra>; porItem: Record<string, Letra> }> {
  const { results } = await db
    .prepare(
      `select musica_id, item_id, letra from anexos
       where letra is not null
         and versao = (select max(versao) from anexos mais
                       where mais.letra is not null
                         and coalesce(mais.musica_id, mais.item_id) = coalesce(anexos.musica_id, anexos.item_id))`,
    )
    .all<{ musica_id: string | null; item_id: string | null; letra: string }>()

  const porMusica: Record<string, Letra> = {}
  const porItem: Record<string, Letra> = {}

  for (const linha of results) {
    const letra = JSON.parse(linha.letra) as Letra
    if (linha.musica_id) porMusica[linha.musica_id] = letra
    else if (linha.item_id) porItem[linha.item_id] = letra
  }

  return { porMusica, porItem }
}

export async function lerConteudo(db: D1Database, id: string): Promise<Uint8Array | null> {
  const linha = await db
    .prepare('select conteudo from anexos where id = ?')
    .bind(id)
    .first<{ conteudo: number[] }>()

  return linha ? Uint8Array.from(linha.conteudo) : null
}

export function anexosPorDono(anexos: Anexo[]): Record<string, Anexo[]> {
  const mapa: Record<string, Anexo[]> = {}

  for (const anexo of anexos) {
    const chave = anexo.itemId === null ? anexo.musicaId : chaveDoItem(anexo.itemId)
    if (chave === null) continue

    mapa[chave] = [...(mapa[chave] ?? []), anexo]
  }

  return mapa
}

async function lerAnexosDe(db: D1Database, coluna: string, ids: string[]): Promise<Anexo[]> {
  if (ids.length === 0) return []

  const lugares = ids.map(() => '?').join(', ')
  const { results } = await db
    .prepare(`select ${CAMPOS} from anexos where ${coluna} in (${lugares}) order by ${coluna}, versao desc`)
    .bind(...ids)
    .all<LinhaDeAnexo>()

  return results.map(montar)
}

function montar(linha: LinhaDeAnexo): Anexo {
  return {
    id: linha.id,
    musicaId: linha.musica_id,
    itemId: linha.item_id,
    nome: linha.nome,
    mime: linha.mime,
    tamanho: linha.tamanho,
    temLetra: linha.tem_letra === 1,
    versao: linha.versao,
    criadoEm: linha.criado_em,
    url: '/api/anexos/' + linha.id,
  }
}

async function proximaVersao(db: D1Database, dono: DonoDoAnexo): Promise<number> {
  const [coluna, donoId] = colunaDoDono(dono)
  const linha = await db
    .prepare(`select coalesce(max(versao), 0) + 1 as proxima from anexos where ${coluna} = ?`)
    .bind(donoId)
    .first<{ proxima: number }>()

  return linha?.proxima ?? 1
}

function colunaDoDono(dono: DonoDoAnexo): [string, string] {
  return 'musicaId' in dono ? ['musica_id', dono.musicaId] : ['item_id', dono.itemId]
}

function desfazerLetra(letra: string | null): Letra | null {
  return letra ? (JSON.parse(letra) as Letra) : null
}
