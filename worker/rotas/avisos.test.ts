import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { vencidas } from '../dados/notificacoes'
import {
  cookieDe,
  criarEscala,
  criarFuncao,
  criarItemInteira,
  criarMembro,
  criarMusica,
  limparBanco,
  porNaEquipe,
} from '../testes/apoio'

const RAIZ = 'http://local.test'
const FUTURA = '2099-09-13'
const PASSADA = '2020-09-13'

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarFuncao('baixo', 'instrumentos', 2, 'Baixo')
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['baixo'] })
  await criarMusica('m1', 'Meia Noite', 'v1')
})

describe('Equipe', () => {
  it('escalar alguém numa Escala Agendada enfileira o aviso pra ela', async () => {
    await criarEscala({ id: 'futura', data: FUTURA })

    const resposta = await pedir('PUT', '/api/escalas/futura/equipe/julia', 'marcos', { funcoes: ['vocal'] })
    expect(resposta.status).toBe(200)

    const fila = await filaAgora()
    expect(fila).toMatchObject([{ membroId: 'julia', tipo: 'escalado', escalaId: 'futura' }])
    expect(fila[0].corpo).toBe('Você está na Escala de dom 13/09, 18h, no vocal')
  })

  it('não enfileira nada ao mexer na Equipe de Escala Realizada', async () => {
    await criarEscala({ id: 'passada', data: PASSADA })

    await pedir('PUT', '/api/escalas/passada/equipe/julia', 'marcos', { funcoes: ['vocal'] })

    expect(await filaAgora()).toHaveLength(0)
  })

  it('trocar a Função depois não gera um segundo aviso', async () => {
    await criarEscala({ id: 'futura', data: FUTURA })

    await pedir('PUT', '/api/escalas/futura/equipe/julia', 'marcos', { funcoes: ['vocal'] })
    await pedir('PUT', '/api/escalas/futura/equipe/julia', 'marcos', { funcoes: ['baixo'] })

    expect(await filaAgora()).toHaveLength(1)
  })
})

describe('Repertório', () => {
  beforeEach(async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'marcos', ['vocal'], true)
    await porNaEquipe('futura', 'julia', ['vocal'])
  })

  it('música nova avisa a Equipe menos quem adicionou', async () => {
    const resposta = await pedir('POST', '/api/escalas/futura/itens', 'marcos', {
      tipo: 'inteira',
      musicaId: 'm1',
      tom: 'G',
    })
    expect(resposta.status).toBe(201)

    const fila = await filaAgora()
    expect(fila).toMatchObject([{ membroId: 'julia', tipo: 'musica' }])
    expect(fila[0].corpo).toBe('Meia Noite (Tom G) entrou na Escala de dom 13/09')
  })

  it('mudar o Tom avisa, reordenar não', async () => {
    await criarItemInteira('i1', 'futura', 'm1', 'G')

    await pedir('PATCH', '/api/escalas/futura/itens/i1', 'marcos', { ordem: 0 })
    expect(await filaAgora()).toHaveLength(0)

    await pedir('PATCH', '/api/escalas/futura/itens/i1', 'marcos', { tom: 'A' })
    const fila = await filaAgora()
    expect(fila).toHaveLength(1)
    expect(fila[0].corpo).toBe('Meia Noite (Tom A) mudou na Escala de dom 13/09')
  })

  it('tirar a música avisa que ela saiu', async () => {
    await criarItemInteira('i1', 'futura', 'm1', 'G')

    await pedir('DELETE', '/api/escalas/futura/itens/i1', 'marcos')

    expect((await filaAgora())[0].corpo).toBe('Meia Noite (Tom G) saiu da Escala de dom 13/09')
  })

  it('editar Repertório de Escala Realizada é silencioso', async () => {
    await criarEscala({ id: 'passada', data: PASSADA })
    await porNaEquipe('passada', 'marcos', ['vocal'], true)
    await porNaEquipe('passada', 'julia', ['vocal'])

    await pedir('POST', '/api/escalas/passada/itens', 'marcos', { tipo: 'inteira', musicaId: 'm1', tom: 'G' })

    expect(await filaAgora()).toHaveLength(0)
  })
})

describe('Escala cancelada ou remarcada', () => {
  beforeEach(async () => {
    await criarEscala({ id: 'futura', data: FUTURA })
    await porNaEquipe('futura', 'marcos', ['vocal'], true)
    await porNaEquipe('futura', 'julia', ['vocal'])
  })

  it('cancelar avisa a Equipe inteira', async () => {
    await pedir('POST', '/api/escalas/futura/cancelar', 'marcos', {})

    const fila = await filaAgora()
    expect(fila).toHaveLength(2)
    expect(fila[0].tipo).toBe('cancelada')
  })

  it('desfazer o cancelamento não avisa de novo', async () => {
    await pedir('POST', '/api/escalas/futura/cancelar', 'marcos', {})
    await pedir('POST', '/api/escalas/futura/desfazer', 'marcos', {})

    expect(await filaAgora()).toHaveLength(2)
  })

  it('mudar a data avisa a Equipe com a data nova', async () => {
    await pedir('PATCH', '/api/escalas/futura', 'marcos', { data: '2099-09-20' })

    const fila = await filaAgora()
    expect(fila).toHaveLength(2)
    expect(fila[0].tipo).toBe('remarcada')
    expect(fila[0].corpo).toBe('Culto de Domingo mudou para dom 20/09, 18h')
  })

  it('mudar só o rótulo não avisa ninguém', async () => {
    await pedir('PATCH', '/api/escalas/futura', 'marcos', { rotulo: 'Culto da Família' })

    expect(await filaAgora()).toHaveLength(0)
  })
})

async function filaAgora() {
  return vencidas(env.DB, new Date())
}

async function pedir(metodo: string, caminho: string, quem: string, corpo?: unknown): Promise<Response> {
  return SELF.fetch(`${RAIZ}${caminho}`, {
    method: metodo,
    headers: { cookie: await cookieDe(quem), 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
}
