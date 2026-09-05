import { VIDEOS, exigir } from './cenario'
import type { Cenario } from './cenario'
import { RAIZ } from './prova'
import type { Prova } from './prova'

const NOME_DA_SEQUENCIA = 'Sequência — Meia Noite.docx'
const MIME_DO_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function fluxosDoAdmin(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Admin · Membros')

  const lista = exigir(await prova.api('/api/admin/membros', { cookie: cenario.gabriel }), 200, 'listar Membros')
  const gabriel = lista.membros.find((m: any) => m.id === 'gabriel')

  prova.conferir(
    'a lista do Admin traz o acesso de cada Membro',
    Number.isInteger(gabriel.sessoes) && Number.isInteger(gabriel.convites) && Number.isInteger(gabriel.push),
    `Gabriel: ${gabriel.sessoes} sessões, ${gabriel.convites} convites, ${gabriel.push} aparelhos`,
  )

  const novo = exigir(
    await prova.api('/api/admin/membros', {
      cookie: cenario.gabriel,
      corpo: { nome: 'Tião do Smoke', funcoes: ['teclado'], ministro: true },
    }),
    201,
    'criar Membro',
  )
  prova.conferir('criar Membro grava nome, Funções e papel', novo.nome === 'Tião do Smoke' && novo.ministro, novo.id)

  const editado = exigir(
    await prova.api(`/api/admin/membros/${novo.id}`, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { nome: 'Tião', funcoes: ['teclado', 'som'], ministro: false },
    }),
    200,
    'editar Membro',
  )
  prova.conferir(
    'editar troca nome, Funções e papéis',
    editado.nome === 'Tião' && editado.funcoes.length === 2 && !editado.ministro,
    editado.funcoes.join(', '),
  )

  const funcaoTorta = await prova.api(`/api/admin/membros/${novo.id}`, {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { funcoes: ['trompete'] },
  })
  prova.conferir('Função desconhecida devolve 422', funcaoTorta.status === 422, funcaoTorta.corpo?.erro)

  const apagado = exigir(
    await prova.api(`/api/admin/membros/${novo.id}`, { metodo: 'DELETE', cookie: cenario.gabriel }),
    200,
    'remover quem nunca serviu',
  )
  prova.conferir('quem nunca serviu é apagado de verdade', apagado.apagado === true)

  const desativada = exigir(
    await prova.api('/api/admin/membros/bia', { metodo: 'DELETE', cookie: cenario.gabriel }),
    200,
    'remover quem já serviu',
  )
  prova.conferir(
    'quem já serviu vira inativo pra não reescrever o histórico',
    desativada.apagado === false && desativada.membro.inativo === true,
    desativada.membro.nome,
  )

  const abertos = exigir(await prova.api('/api/membros', { cookie: cenario.gabriel }), 200, 'lista aberta de Membros')
  prova.conferir(
    'o inativo some da lista aberta e fica na do Admin',
    !abertos.membros.some((m: any) => m.id === 'bia'),
    `${abertos.membros.length} ativos`,
  )

  const devolta = exigir(
    await prova.api('/api/admin/membros/bia', { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { inativo: false } }),
    200,
    'trazer o Membro de volta',
  )
  prova.conferir('trazer de volta desfaz a desativação', devolta.inativo === false)

  const euMesmo = await prova.api('/api/admin/membros/gabriel', { metodo: 'DELETE', cookie: cenario.gabriel })
  prova.conferir('o Admin não remove a si mesmo', euMesmo.status === 422, euMesmo.corpo?.erro)

  const semAdmin = await prova.api('/api/admin/membros/gabriel', {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { admin: false },
  })
  prova.conferir('o Admin não tira o próprio papel', semAdmin.status === 422, semAdmin.corpo?.erro)

  prova.grupo('Admin · Funções')

  const percussao = exigir(
    await prova.api('/api/admin/funcoes', {
      cookie: cenario.gabriel,
      corpo: { nome: 'Percussão', naipe: 'instrumentos', ordem: 9 },
    }),
    201,
    'criar Função',
  )
  prova.conferir('criar Função grava naipe e ordem', percussao.naipe === 'instrumentos' && percussao.ordem === 9)

  const naipeTorto = await prova.api('/api/admin/funcoes', {
    cookie: cenario.gabriel,
    corpo: { nome: 'Palco', naipe: 'palco' },
  })
  prova.conferir('naipe inventado devolve 422', naipeTorto.status === 422, naipeTorto.corpo?.erro)

  const usada = await prova.api('/api/admin/funcoes/vocal', { metodo: 'DELETE', cookie: cenario.gabriel })
  prova.conferir('apagar Função já usada devolve 409', usada.status === 409, usada.corpo?.erro)

  const apagadaFuncao = exigir(
    await prova.api(`/api/admin/funcoes/${percussao.id}`, { metodo: 'DELETE', cookie: cenario.gabriel }),
    200,
    'apagar Função nova',
  )
  prova.conferir('Função que ninguém usou apaga normalmente', apagadaFuncao.apagada === true)

  prova.grupo('Admin · Formações')

  const formacao = exigir(
    await prova.api('/api/formacoes', { cookie: cenario.gabriel, corpo: { nome: 'Formação do Smoke' } }),
    201,
    'criar Formação vazia',
  )
  prova.conferir('dá pra criar Formação vazia pelo Admin', formacao.entradas.length === 0, formacao.nome)

  const comEntradas = exigir(
    await prova.api(`/api/formacoes/${formacao.id}`, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { nome: 'Formação editada', entradas: [{ membroId: 'gabriel', funcoes: ['guitarra'] }] },
    }),
    200,
    'editar Formação',
  )
  prova.conferir(
    'editar a Formação troca nome e entradas',
    comEntradas.nome === 'Formação editada' && comEntradas.entradas.length === 1,
  )

  const membroTorto = await prova.api(`/api/formacoes/${formacao.id}`, {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { entradas: [{ membroId: 'ninguem', funcoes: ['guitarra'] }] },
  })
  prova.conferir('Membro inexistente na Formação devolve 422', membroTorto.status === 422, membroTorto.corpo?.erro)

  const apagadaFormacao = exigir(
    await prova.api(`/api/formacoes/${formacao.id}`, { metodo: 'DELETE', cookie: cenario.gabriel }),
    200,
    'apagar Formação',
  )
  prova.conferir('apagar Formação funciona', apagadaFormacao.apagada === true)

  prova.grupo('Admin · Músicas a revisar e Sequência')

  const paraRevisar = exigir(
    await prova.api('/api/musicas?filtro=revisar', { cookie: cenario.gabriel }),
    200,
    'listar as Músicas a revisar',
  )
  prova.conferir('o catálogo importado nasce marcado pra revisão', paraRevisar.musicas.length >= 100, `${paraRevisar.musicas.length} esperando`)

  const alvo = paraRevisar.musicas[0]
  const revisada = exigir(
    await prova.api(`/api/musicas/${alvo.id}`, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { titulo: 'Título revisado no smoke', artista: 'Artista revisado', revisar: false },
    }),
    200,
    'revisar título e artista',
  )
  prova.conferir(
    'revisar troca título e artista e tira da fila',
    revisada.titulo === 'Título revisado no smoke' && revisada.revisar === false,
  )

  const depoisDaRevisao = exigir(
    await prova.api('/api/musicas?filtro=revisar', { cookie: cenario.gabriel }),
    200,
    'listar de novo',
  )
  prova.conferir(
    'a Música revisada sai da lista',
    depoisDaRevisao.musicas.length === paraRevisar.musicas.length - 1,
    `${paraRevisar.musicas.length} → ${depoisDaRevisao.musicas.length}`,
  )

  const musicaId = cenario.musicas.get(VIDEOS.meiaNoite)!
  const conteudo = new Uint8Array(2048).map((_, i) => (i * 7) % 256)

  const anexo = exigir(await enviarSequencia(prova, cenario, musicaId, conteudo), 201, 'enviar a Sequência')
  prova.conferir('a Sequência sobe como versão 1', anexo.versao === 1 && anexo.tamanho === 2048, anexo.nome)
  prova.conferir('o nome com acento e travessão volta inteiro', anexo.nome === NOME_DA_SEQUENCIA, anexo.nome)

  const baixado = await fetch(`${RAIZ}/api/anexos/${anexo.id}`, { headers: { cookie: cenario.julia } })
  const bytes = new Uint8Array(await baixado.arrayBuffer())

  prova.conferir('o Membro baixa a Sequência com o mime do Word', baixado.headers.get('content-type') === MIME_DO_WORD)
  prova.conferir(
    'o download traz o nome do arquivo em UTF-8',
    String(baixado.headers.get('content-disposition')).includes("filename*=UTF-8''"),
  )
  prova.conferir(
    'o arquivo baixa byte a byte igual ao que subiu',
    bytes.length === conteudo.length && bytes.every((byte, i) => byte === conteudo[i]),
    `${bytes.length} bytes`,
  )

  const versao2 = exigir(await enviarSequencia(prova, cenario, musicaId, conteudo), 201, 'enviar a segunda versão')
  prova.conferir('o segundo envio vira versão 2', versao2.versao === 2)

  const versoes = exigir(
    await prova.api(`/api/musicas/${musicaId}/anexos`, { cookie: cenario.julia }),
    200,
    'listar as versões',
  )
  prova.conferir(
    'as versões saem da mais nova pra mais velha',
    versoes.anexos.length === 2 && versoes.anexos[0].versao === 2,
    versoes.anexos.map((a: any) => `v${a.versao}`).join(', '),
  )

  const grande = await enviarSequencia(prova, cenario, musicaId, new Uint8Array(1024 * 1024 + 1))
  prova.conferir('arquivo acima de 1 MB devolve 413', grande.status === 413, grande.corpo?.erro)

  const semPapel = await enviarSequencia(prova, { ...cenario, gabriel: cenario.julia }, musicaId, conteudo)
  prova.conferir('Membro comum não envia Sequência', semPapel.status === 403, semPapel.corpo?.erro)

  prova.grupo('Admin · Convites e lista do "esqueci"')

  const convite = exigir(
    await prova.api('/api/admin/convites', { cookie: cenario.gabriel, corpo: { membroId: 'pedro' } }),
    201,
    'gerar convite',
  )
  prova.conferir('gerar convite devolve o link de entrar', convite.link === `/entrar/${convite.token}`, convite.link)

  const desligada = exigir(
    await prova.api('/api/admin/configuracoes', {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { listaEsqueci: false },
    }),
    200,
    'desligar a lista do "esqueci"',
  )
  prova.conferir('a configuração desliga', desligada.listaEsqueci === false)

  const recusada = await prova.api('/api/esqueci')
  prova.conferir('com a lista desligada o "esqueci" devolve 403', recusada.status === 403, recusada.corpo?.erro)

  exigir(
    await prova.api('/api/admin/configuracoes', {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { listaEsqueci: true },
    }),
    200,
    'religar a lista',
  )
  const religada = await prova.api('/api/esqueci')
  prova.conferir('religada, a lista volta a responder', religada.status === 200, `${religada.corpo?.membros?.length} Membros`)

  const valorTorto = await prova.api('/api/admin/configuracoes', {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { listaEsqueci: 'talvez' },
  })
  prova.conferir('a configuração recusa valor que não é sim ou não', valorTorto.status === 422, valorTorto.corpo?.erro)
}

function enviarSequencia(prova: Prova, cenario: Cenario, musicaId: string, conteudo: Uint8Array<ArrayBuffer>) {
  const formulario = new FormData()
  formulario.set('arquivo', new File([conteudo], NOME_DA_SEQUENCIA, { type: MIME_DO_WORD }))

  return prova.api(`/api/musicas/${musicaId}/anexos`, { cookie: cenario.gabriel, formulario })
}
