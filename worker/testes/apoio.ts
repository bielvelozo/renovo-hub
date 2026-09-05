import { env } from 'cloudflare:test'

export type MembroDeTeste = {
  id: string
  nome: string
  admin?: boolean
  ministro?: boolean
  funcoes?: string[]
}

const AGORA = '2026-09-05T12:00:00.000Z'

// O pool não isola o D1 entre testes. Apaga em ordem inversa à de criação: como
// as migrations criam pai antes de filho, o inverso apaga filho antes de pai e
// nenhuma chave estrangeira quebra no meio do batch.
export async function limparBanco(): Promise<void> {
  const { results } = await env.DB.prepare(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%' and name != 'd1_migrations' order by rowid desc",
  ).all<{ name: string }>()

  await env.DB.batch(results.map((tabela) => env.DB.prepare(`delete from ${tabela.name}`)))
}

export async function criarFuncao(id: string, naipe: string, ordem: number): Promise<void> {
  await env.DB.prepare('insert into funcoes (id, nome, naipe, ordem) values (?, ?, ?, ?)')
    .bind(id, id, naipe, ordem)
    .run()
}

export async function criarMembro(membro: MembroDeTeste): Promise<string> {
  await env.DB.prepare('insert into membros (id, nome, admin, ministro, criado_em) values (?, ?, ?, ?, ?)')
    .bind(membro.id, membro.nome, membro.admin ? 1 : 0, membro.ministro ? 1 : 0, AGORA)
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
