import { SELF, env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { hojeEmBrasilia, somarDias } from '../../src/dominio'
import { criarAnexo } from '../dados/anexos'
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
const hoje = hojeEmBrasilia()
const MES_CORRENTE = hoje.slice(0, 7)
const MES_SEGUINTE = seguinte(MES_CORRENTE)

type Inicio = {
  minhaProxima: {
    id: string
    itens: { atualizadoEm: string | null; memoria: Memoria | null }[]
    pessoas: { membroId: string; nome: string; funcoes: string[]; ministro: boolean }[]
  } | null
  proximoCulto: { id: string } | null
  pendencias: { id: string; pendencias: { chave: string }[]; minhasFuncoes: string[] }[]
  posCulto: { escalaId: string } | null
  anexosPorDono: Record<string, { id: string }[]>
  semanasDeRepeticao: number
  proximoMesVazio: string | null
}

type Memoria = {
  recente: boolean
  ultimaExecucao: { escalaId: string; tom: string } | null
  planejadaEm: { escalaId: string }[]
}

function seguinte(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number)
  return numero === 12 ? `${ano + 1}-01` : `${ano}-${String(numero + 1).padStart(2, '0')}`
}

beforeEach(async () => {
  await limparBanco()
  await criarFuncao('vocal', 'vocal', 1, 'Vocal')
  await criarFuncao('guitarra', 'instrumentos', 3, 'Guitarra')
  await criarMembro({ id: 'marcos', nome: 'Marcos', ministro: true, funcoes: ['vocal'] })
  await criarMembro({ id: 'julia', nome: 'Júlia', funcoes: ['vocal'] })
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
})

async function pedir(quem: string): Promise<Inicio> {
  const resposta = await SELF.fetch(`${RAIZ}/api/inicio`, { headers: { cookie: await cookieDe(quem) } })
  return resposta.json<Inicio>()
}

describe('GET /api/inicio', () => {
  it('exige sessão', async () => {
    expect((await SELF.fetch(`${RAIZ}/api/inicio`)).status).toBe(401)
  })

  it('mostra a escala da pessoa e cala o próximo culto quando é a mesma', async () => {
    await criarEscala({ id: 'minha', data: somarDias(hoje, 7) })
    await porNaEquipe('minha', 'julia', ['vocal'])

    const inicio = await pedir('julia')

    expect(inicio.minhaProxima?.id).toBe('minha')
    expect(inicio.proximoCulto).toBeNull()
  })

  it('traz a Equipe como pessoas, com o Ministro na frente', async () => {
    await criarEscala({ id: 'minha', data: somarDias(hoje, 7) })
    await porNaEquipe('minha', 'julia', ['guitarra'])
    await porNaEquipe('minha', 'marcos', ['vocal'], true)

    expect((await pedir('julia')).minhaProxima?.pessoas).toEqual([
      { membroId: 'marcos', nome: 'Marcos', funcoes: ['Vocal'], ministro: true, grupo: 'vocal' },
      { membroId: 'julia', nome: 'Júlia', funcoes: ['Guitarra'], ministro: false, grupo: 'instrumentos' },
    ])
  })

  it('mostra o próximo culto pra quem não está escalado', async () => {
    await criarEscala({ id: 'alheia', data: somarDias(hoje, 7) })
    await porNaEquipe('alheia', 'marcos', ['vocal'], true)

    const inicio = await pedir('julia')

    expect(inicio.minhaProxima).toBeNull()
    expect(inicio.proximoCulto?.id).toBe('alheia')
  })

  it('cobra pendências de quem dirige e nada de quem não dirige', async () => {
    await criarEscala({ id: 'e1', data: somarDias(hoje, 7) })
    await porNaEquipe('e1', 'marcos', ['vocal'], true)
    await porNaEquipe('e1', 'julia', ['vocal'])

    const doMinistro = await pedir('marcos')
    expect(doMinistro.pendencias.map((e) => e.id)).toEqual(['e1'])
    expect(doMinistro.pendencias[0].pendencias.map((p) => p.chave)).toEqual(['sem-musicas'])
    expect(doMinistro.pendencias[0].minhasFuncoes).toEqual(['Vocal'])

    expect((await pedir('julia')).pendencias).toEqual([])
  })

  it('deixa de fora a agendada além das quatro semanas', async () => {
    await criarEscala({ id: 'longe', data: somarDias(hoje, 40) })
    await porNaEquipe('longe', 'marcos', ['vocal'], true)

    expect((await pedir('marcos')).pendencias).toEqual([])
  })

  it('aponta o mês corrente quando não há escala nenhuma', async () => {
    expect((await pedir('marcos')).proximoMesVazio).toBe(MES_CORRENTE)
  })

  it('não aponta mês quando o corrente e o seguinte têm escala', async () => {
    await criarEscala({ id: 'agora', data: hoje })
    await criarEscala({ id: 'depois', data: MES_SEGUINTE + '-15' })

    expect((await pedir('marcos')).proximoMesVazio).toBeNull()
  })

  it('não aponta mês pra quem não dirige', async () => {
    expect((await pedir('julia')).proximoMesVazio).toBeNull()
  })

  it('traz o limite de repetição, os anexos e a memória do Repertório', async () => {
    await criarEscala({ id: 'passada', data: somarDias(hoje, -10) })
    await porNaEquipe('passada', 'marcos', ['vocal'], true)
    await criarItemInteira('i0', 'passada', 'rio', 'G')

    await criarEscala({ id: 'minha', data: somarDias(hoje, 7) })
    await porNaEquipe('minha', 'julia', ['vocal'])
    await criarItemInteira('i1', 'minha', 'rio', 'D')

    await criarEscala({ id: 'outra', data: somarDias(hoje, 14) })
    await criarItemInteira('i2', 'outra', 'rio', 'E')

    await criarAnexo(env.DB, { musicaId: 'rio' }, {
      nome: 'rio.docx',
      mime: 'texto',
      conteudo: new ArrayBuffer(4),
      letra: { cabecalho: [], blocos: [] },
    })

    const inicio = await pedir('julia')
    const item = inicio.minhaProxima?.itens[0]

    expect(inicio.semanasDeRepeticao).toBe(4)
    expect(inicio.anexosPorDono.rio).toHaveLength(1)
    expect(item?.atualizadoEm).toBeNull()
    expect(item?.memoria?.ultimaExecucao).toMatchObject({ escalaId: 'passada', tom: 'G' })
    expect(item?.memoria?.planejadaEm.map((p) => p.escalaId)).toEqual(['outra'])
  })

  it('não mostra cartão pós-culto quando não há Escala na janela', async () => {
    await criarEscala({ id: 'minha', data: somarDias(hoje, 7) })
    await porNaEquipe('minha', 'marcos', ['vocal'], true)

    expect((await pedir('marcos')).posCulto).toBeNull()
  })
})
