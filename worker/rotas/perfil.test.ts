import { SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { diaDaSemana, hojeEmBrasilia, somarDias } from '../../src/dominio'
import { cookieDe, criarEscala, criarFuncao, criarMembro, limparBanco, porNaEquipe } from '../testes/apoio'

const RAIZ = 'http://local.test'

type PerfilJson = {
  membro: { id: string; nome: string; ministro: boolean; inativo: boolean; funcoes: { id: string; nome: string; naipe: string }[] }
  escalasNoAno: number
  ultimaEscala: { id: string; data: string; titulo: string; estado: string } | null
  finsDeSemanaSeguidos: number
  textoDeFinsDeSemana: string | null
}

const hoje = hojeEmBrasilia()
const domingoPassado = somarDias(hoje, -(diaDaSemana(hoje) || 7))
const DOMINGOS = [domingoPassado, somarDias(domingoPassado, -7), somarDias(domingoPassado, -14)]
const NO_ANO = DOMINGOS.filter((data) => data.startsWith(hoje.slice(0, 4))).length

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarFuncao('som', 'tecnica', 8, 'Som')
  await criarMembro({ id: 'gabriel', nome: 'Gabriel', admin: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'davi', nome: 'Davi', funcoes: ['som'] })
  await criarMembro({ id: 'ana', nome: 'Ana', funcoes: ['vocal'] })

  for (const [indice, data] of DOMINGOS.entries()) {
    await criarEscala({ id: 'e' + indice, data })
    await porNaEquipe('e' + indice, 'gabriel', ['vocal'])
    await porNaEquipe('e' + indice, 'davi', ['som'])
  }
})

async function perfil(id: string, quem = 'gabriel'): Promise<Response> {
  return SELF.fetch(`${RAIZ}/api/perfil/${id}`, { headers: { cookie: await cookieDe(quem) } })
}

describe('GET /api/perfil/:id', () => {
  it('devolve Funções, Escalas no ano, última Escala e fins de semana seguidos', async () => {
    const resposta = await perfil('gabriel')

    expect(resposta.status).toBe(200)
    const corpo = await resposta.json<PerfilJson>()

    expect(corpo.membro).toMatchObject({ id: 'gabriel', nome: 'Gabriel', inativo: false })
    expect(corpo.membro.funcoes).toEqual([{ id: 'vocal', nome: 'Vocal', naipe: 'vocal', ordem: 1 }])
    expect(corpo.escalasNoAno).toBe(NO_ANO)
    expect(corpo.ultimaEscala).toMatchObject({ id: 'e0', data: DOMINGOS[0], estado: 'realizada' })
    expect(corpo.finsDeSemanaSeguidos).toBe(3)
    expect(corpo.textoDeFinsDeSemana).toBe('3 fins de semana seguidos')
  })

  it('conta o Membro de Função técnica igual, porque presença não é Execução', async () => {
    const corpo = await (await perfil('davi')).json<PerfilJson>()

    expect(corpo.finsDeSemanaSeguidos).toBe(3)
    expect(corpo.escalasNoAno).toBe(NO_ANO)
  })

  it('quem nunca foi escalado não tem última Escala nem sequência', async () => {
    const corpo = await (await perfil('ana')).json<PerfilJson>()

    expect(corpo.ultimaEscala).toBeNull()
    expect(corpo.escalasNoAno).toBe(0)
    expect(corpo.finsDeSemanaSeguidos).toBe(0)
    expect(corpo.textoDeFinsDeSemana).toBeNull()
  })

  it('fim de semana com Escala Realizada sem o Membro quebra a sequência', async () => {
    await criarEscala({ id: 'extra', data: somarDias(domingoPassado, -21) })
    await porNaEquipe('extra', 'ana', ['vocal'])
    await criarEscala({ id: 'antes', data: somarDias(domingoPassado, -28) })
    await porNaEquipe('antes', 'gabriel', ['vocal'])

    const corpo = await (await perfil('gabriel')).json<PerfilJson>()

    expect(corpo.finsDeSemanaSeguidos).toBe(3)
  })

  it('fim de semana só com Escala Cancelada é neutro', async () => {
    await criarEscala({ id: 'cancelada', data: somarDias(domingoPassado, -21), cancelada: true })
    await criarEscala({ id: 'antes', data: somarDias(domingoPassado, -28) })
    await porNaEquipe('antes', 'gabriel', ['vocal'])

    const corpo = await (await perfil('gabriel')).json<PerfilJson>()

    expect(corpo.finsDeSemanaSeguidos).toBe(4)
  })

  it('Membro desconhecido devolve 404 e sem cookie 401', async () => {
    expect((await perfil('ninguem')).status).toBe(404)
    expect((await SELF.fetch(`${RAIZ}/api/perfil/gabriel`)).status).toBe(401)
  })
})
