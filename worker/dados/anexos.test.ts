import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Letra } from '../../src/dominio'
import { criarEscala, criarMusica, limparBanco } from '../testes/apoio'
import { anexosPorDono, criarAnexo, lerLetra, letraMaisNova, letrasMaisNovas, musicasComLetra } from './anexos'

const CONTEUDO = new Uint8Array([1, 2, 3]).buffer

function letraDe(texto: string): Letra {
  return { cabecalho: [], blocos: [{ tipo: 'estrofe', linhas: [{ texto, forte: false }] }] }
}

async function criarMedley(id: string, escalaId: string): Promise<void> {
  await env.DB.prepare('insert into itens (id, escala_id, tipo, ordem, observacao) values (?, ?, ?, ?, ?)')
    .bind(id, escalaId, 'medley', 1, '')
    .run()
}

async function enviar(dono: { musicaId: string } | { itemId: string }, texto: string, nome = 'Letra.docx') {
  return criarAnexo(env.DB, dono, { nome, mime: 'word', conteudo: CONTEUDO, letra: letraDe(texto) })
}

beforeEach(async () => {
  await limparBanco()
  await criarMusica('rio', 'Rio', 's1oU-6vYc4E')
  await criarEscala({ id: 'e1', data: '2099-08-16' })
  await criarMedley('i1', 'e1')
})

describe('anexos com letra', () => {
  it('conta a versão por dono e guarda a letra de cada um', async () => {
    const primeiro = await enviar({ musicaId: 'rio' }, 'Primeira')
    await enviar({ musicaId: 'rio' }, 'Segunda')
    const doItem = await enviar({ itemId: 'i1' }, 'Do medley')

    expect(await lerLetra(env.DB, primeiro)).toEqual(letraDe('Primeira'))
    expect(await letraMaisNova(env.DB, { musicaId: 'rio' })).toEqual(letraDe('Segunda'))
    expect(await letraMaisNova(env.DB, { itemId: 'i1' })).toEqual(letraDe('Do medley'))
    expect((await lerLetra(env.DB, doItem))?.blocos).toHaveLength(1)
  })

  it('não acha letra de quem nunca recebeu anexo', async () => {
    expect(await letraMaisNova(env.DB, { musicaId: 'rio' })).toBeNull()
    expect(await lerLetra(env.DB, 'nao-existe')).toBeNull()
  })

  it('as letras mais novas saem separadas por Música e por Item', async () => {
    await enviar({ musicaId: 'rio' }, 'Velha')
    await enviar({ musicaId: 'rio' }, 'Nova')
    await enviar({ itemId: 'i1' }, 'Do medley')

    expect(await letrasMaisNovas(env.DB)).toEqual({
      porMusica: { rio: letraDe('Nova') },
      porItem: { i1: letraDe('Do medley') },
    })
  })

  it('só a Música com letra entra em musicasComLetra', async () => {
    await criarMusica('sublime', 'Sublime', 'pXQRyiSZ8mQ')
    await enviar({ musicaId: 'rio' }, 'Primeira')
    await env.DB.prepare(
      "insert into anexos (id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em) values ('antigo', 'sublime', 'x.docx', 'word', 1, x'00', 1, '2026-01-01T00:00:00.000Z')",
    ).run()

    expect([...(await musicasComLetra(env.DB))]).toEqual(['rio'])
  })

  it('agrupa por dono com a chave da Música e a do Item', async () => {
    const musica = await enviar({ musicaId: 'rio' }, 'Da música')
    const item = await enviar({ itemId: 'i1' }, 'Do medley')
    const anexos = [
      { id: musica, musicaId: 'rio', itemId: null },
      { id: item, musicaId: null, itemId: 'i1' },
    ]

    const porDono = anexosPorDono(
      anexos.map((anexo) => ({
        ...anexo,
        nome: 'Letra.docx',
        mime: 'word',
        tamanho: 3,
        temLetra: true,
        versao: 1,
        criadoEm: '',
        url: '/api/anexos/' + anexo.id,
      })),
    )

    expect(Object.keys(porDono).sort()).toEqual(['item:i1', 'rio'])
    expect(porDono['item:i1'][0].itemId).toBe('i1')
  })
})
