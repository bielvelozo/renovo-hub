import { somarDias } from '../../src/dominio'
import { docxDe } from '../../src/letra/docxSintetico'
import { VIDEOS, exigir, hojeDoAmbiente } from './cenario'
import type { Cenario } from './cenario'
import type { Prova } from './prova'

const MIME_DO_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function fluxosDoCulto(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Culto · Letra do Medley e pacote')

  const escala = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}`, { cookie: cenario.gabriel }),
    200,
    'abrir a Escala do mês',
  )
  const medley = escala.itens.find((item: any) => item.tipo === 'medley')
  const inteira = escala.itens.find((item: any) => item.tipo === 'inteira')

  const anexo = exigir(await enviarWord(prova, cenario, medley.id), 201, 'enviar o Word do Medley')
  prova.conferir('o Word do Medley sobe no Item com a letra lida', anexo.itemId === medley.id && anexo.temLetra === true)

  const lida = exigir(await prova.api(`/api/itens/${medley.id}/letra`, { cookie: cenario.julia }), 200, 'ler a letra do Item')
  prova.conferir(
    'a letra do Medley volta com marcador e estrofe',
    lida.letra?.blocos?.some((b: any) => b.tipo === 'marcador') && lida.letra?.blocos?.some((b: any) => b.tipo === 'estrofe'),
  )

  const recusa = await enviarWord(prova, cenario, inteira.id)
  prova.conferir('Item que não é Medley não recebe letra pela Escala', recusa.status === 422, recusa.corpo?.erro)

  const comLetra = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}`, { cookie: cenario.julia }),
    200,
    'reabrir a Escala',
  )
  prova.conferir(
    'a Escala aponta a letra do Medley pelo Item',
    (comLetra.anexosPorDono?.[`item:${medley.id}`] ?? []).some((a: any) => a.temLetra),
    Object.keys(comLetra.anexosPorDono ?? {}).join(', '),
  )

  const pacote = exigir(await prova.api('/api/culto/pacote', { cookie: cenario.julia }), 200, 'baixar o pacote do culto')
  const hoje = hojeDoAmbiente()
  const meiaNoite = pacote.catalogo.find((m: any) => m.id === cenario.musicas.get(VIDEOS.meiaNoite))

  prova.conferir('o pacote diz quando foi gerado', typeof pacote.geradoEm === 'string' && pacote.geradoEm > hoje)
  const ontem = somarDias(hoje, -1)
  prova.conferir(
    'o pacote só leva escalas de ontem em diante, pela vigília que passa da meia-noite, e não canceladas',
    pacote.escalas.every((e: any) => e.data >= ontem && e.cancelada === undefined),
    pacote.escalas.map((e: any) => e.data).join(', '),
  )
  prova.conferir(
    'a Escala de ontem viaja no pacote',
    pacote.escalas.some((e: any) => e.data === ontem),
    pacote.escalas.map((e: any) => e.data).join(', '),
  )
  prova.conferir('a Sequência enviada pelo Admin viaja no catálogo do pacote', !!meiaNoite?.letra?.blocos?.length)
  prova.conferir(
    'toda música do pacote tem tom nulo ou com origem conhecida',
    pacote.catalogo.every(
      (m: any) => m.tom === null || ['execucao', 'conhecido', 'original'].includes(m.tom.origem),
    ),
  )

  const noPacote = pacote.escalas.find((e: any) => e.id === cenario.escalaDoMes)
  if (noPacote) {
    const item = noPacote.itens.find((i: any) => i.id === medley.id)
    prova.conferir('o Medley leva a própria letra no pacote', !!item?.letra?.blocos?.length)
  }
}

function enviarWord(prova: Prova, cenario: Cenario, itemId: string) {
  const formulario = new FormData()
  formulario.set('arquivo', new File([wordDoMedley() as BufferSource], 'Medley.docx', { type: MIME_DO_WORD }))

  return prova.api(`/api/itens/${itemId}/anexos`, { cookie: cenario.gabriel, formulario })
}

function wordDoMedley(): Uint8Array {
  return docxDe([
    { runs: [{ texto: '//RIO', cor: '1F4E79' }] },
    'Deixa o rio correr',
    '',
    { runs: [{ texto: '//GRATO', cor: '1F4E79' }] },
    { runs: [{ texto: 'Grato sou', negrito: true }] },
  ])
}
