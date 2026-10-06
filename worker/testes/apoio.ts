import { env } from 'cloudflare:test'

export type MembroDeTeste = {
  id: string
  nome: string
  admin?: boolean
  ministro?: boolean
  inativo?: boolean
  funcoes?: string[]
}

const AGORA = '2026-09-05T12:00:00.000Z'

export async function limparBanco(): Promise<void> {
  const { results } = await env.DB.prepare(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%' and name != 'd1_migrations' order by rowid desc",
  ).all<{ name: string }>()

  await env.DB.batch(results.map((tabela) => env.DB.prepare(`delete from ${tabela.name}`)))
}

export async function criarFuncao(id: string, grupo: string, ordem: number, nome = id, minimo = 0): Promise<void> {
  await env.DB.prepare('insert into funcoes (id, nome, grupo, ordem, minimo) values (?, ?, ?, ?, ?)')
    .bind(id, nome, grupo, ordem, minimo)
    .run()
}

export async function criarMembro(membro: MembroDeTeste): Promise<string> {
  await env.DB.prepare(
    'insert into membros (id, nome, admin, ministro, inativo, criado_em) values (?, ?, ?, ?, ?, ?)',
  )
    .bind(membro.id, membro.nome, membro.admin ? 1 : 0, membro.ministro ? 1 : 0, membro.inativo ? 1 : 0, AGORA)
    .run()

  for (const funcaoId of membro.funcoes ?? []) {
    await env.DB.prepare('insert into membro_funcoes (membro_id, funcao_id) values (?, ?)')
      .bind(membro.id, funcaoId)
      .run()
  }

  return membro.id
}

export async function cookieDe(membroId: string): Promise<string> {
  const token = crypto.randomUUID()
  await env.DB.prepare('insert into sessoes (token, membro_id, criado_em, ultimo_uso) values (?, ?, ?, ?)')
    .bind(token, membroId, AGORA, AGORA)
    .run()
  return `sessao=${token}`
}

export async function definirConfiguracao(chave: string, valor: string): Promise<void> {
  await env.DB.prepare('insert or replace into configuracoes (chave, valor) values (?, ?)').bind(chave, valor).run()
}

export function cookieDaResposta(resposta: Response): string {
  const cabecalho = resposta.headers.get('Set-Cookie') ?? ''
  return cabecalho.split(';')[0]
}

export type EscalaDeTeste = {
  id: string
  data: string
  horario?: string
  rotulo?: string
  santaCeia?: boolean
  cancelada?: boolean
}

export async function criarEscala(escala: EscalaDeTeste): Promise<string> {
  await env.DB.prepare(
    'insert into escalas (id, data, horario, rotulo, santa_ceia, cancelada, criado_em) values (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      escala.id,
      escala.data,
      escala.horario ?? '18:00',
      escala.rotulo ?? 'Culto de Domingo',
      escala.santaCeia ? 1 : 0,
      escala.cancelada ? 1 : 0,
      AGORA,
    )
    .run()

  return escala.id
}

export async function porNaEquipe(
  escalaId: string,
  membroId: string,
  funcoes: string[],
  ministro = false,
): Promise<void> {
  await env.DB.prepare('insert into equipe_membros (escala_id, membro_id, ministro) values (?, ?, ?)')
    .bind(escalaId, membroId, ministro ? 1 : 0)
    .run()

  for (const funcaoId of funcoes) {
    await env.DB.prepare('insert into equipe_funcoes (escala_id, membro_id, funcao_id) values (?, ?, ?)')
      .bind(escalaId, membroId, funcaoId)
      .run()
  }
}

export async function criarMusica(id: string, titulo: string, videoId: string): Promise<string> {
  await env.DB.prepare(
    'insert into musicas (id, titulo, artista, video_id, legado, criado_em) values (?, ?, ?, ?, 1, ?)',
  )
    .bind(id, titulo, 'Canal', videoId, AGORA)
    .run()

  return id
}

export async function criarItemInteira(
  id: string,
  escalaId: string,
  musicaId: string,
  tom: string,
  ordem = 0,
): Promise<string> {
  await env.DB.prepare('insert into itens (id, escala_id, ordem, tipo, musica_id, tom) values (?, ?, ?, ?, ?, ?)')
    .bind(id, escalaId, ordem, 'inteira', musicaId, tom)
    .run()

  return id
}

export async function criarFormacao(id: string, nome: string, entradas: [string, string][]): Promise<string> {
  await env.DB.prepare('insert into formacoes (id, nome) values (?, ?)').bind(id, nome).run()

  for (const [membroId, funcaoId] of entradas) {
    await env.DB.prepare('insert into formacao_entradas (formacao_id, membro_id, funcao_id) values (?, ?, ?)')
      .bind(id, membroId, funcaoId)
      .run()
  }

  return id
}

export type SugestaoDeTeste = {
  id: string
  membroId: string
  musicaId?: string | null
  link?: string | null
  titulo?: string | null
  observacao?: string
  data?: string
}

export async function criarSugestao(sugestao: SugestaoDeTeste): Promise<string> {
  await env.DB.prepare(
    'insert into sugestoes (id, membro_id, musica_id, link, titulo, observacao, data) values (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      sugestao.id,
      sugestao.membroId,
      sugestao.musicaId ?? null,
      sugestao.link ?? null,
      sugestao.titulo ?? null,
      sugestao.observacao ?? '',
      sugestao.data ?? AGORA,
    )
    .run()

  return sugestao.id
}

export async function apoiarNoBanco(sugestaoId: string, membroId: string): Promise<void> {
  await env.DB.prepare('insert into apoios (sugestao_id, membro_id) values (?, ?)').bind(sugestaoId, membroId).run()
}
