import { domingosDoMes, segundos } from '../../src/dominio'
import { consultar } from './ambiente'
import {
  VIDEOS,
  dataDaDemonstracao,
  escalaPorData,
  escalaPorRotulo,
  exigir,
  grupo,
  itemPorId,
  proximoSabado,
  ultimoItem,
} from './cenario'
import type { Cenario } from './cenario'
import type { Prova } from './prova'

const REALIZADA_COM_PEDRO = '2026-08-16'
const REALIZADA_COM_TRECHO = '2026-08-30'
const MODELO_DE_FORMACAO = '2026-08-23'

export async function roteiroDoMes(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 1 · Montar o mês')

  const lote = exigir(
    await prova.api('/api/escalas/mes', { cookie: cenario.gabriel, corpo: { mes: cenario.mesDeTrabalho } }),
    201,
    'criar o mês',
  )

  const [ano, mes] = cenario.mesDeTrabalho.split('-').map(Number)
  const domingos = domingosDoMes(ano, mes)
  const doMes = exigir(
    await prova.api(`/api/escalas?mes=${cenario.mesDeTrabalho}`, { cookie: cenario.gabriel }),
    200,
    'listar as Escalas do mês',
  )
  const porData = new Map<string, any>(doMes.escalas.map((escala: any) => [escala.data, escala]))
  const nosDomingos = domingos.map((data) => porData.get(data))

  prova.conferir(
    'o lote deixa uma Escala em cada domingo do mês',
    domingos.length >= 4 && nosDomingos.every(Boolean),
    `${lote.criadas.length} criadas em ${domingos.length} domingos de ${cenario.mesDeTrabalho}`,
  )
  prova.conferir(
    'o segundo domingo nasce Santa Ceia às 08h',
    nosDomingos[1].santaCeia === true && nosDomingos[1].horario === '08:00',
    nosDomingos[1].titulo,
  )
  prova.conferir(
    'os outros nascem Culto de Domingo 18h',
    [nosDomingos[0], ...nosDomingos.slice(2)].every((e: any) => !e.santaCeia && e.horario === '18:00'),
    nosDomingos[0].titulo,
  )
  prova.conferir(
    'o único Membro do Som já nasce na Equipe, sem ninguém escalar',
    nosDomingos.every((e: any) => e.membros.includes('davi')),
    nosDomingos[0].membros.join(', '),
  )

  cenario.escalaDoMes = nosDomingos[0].id
  cenario.escalaSobrando = nosDomingos[nosDomingos.length - 1].id

  const comIsa = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/isa`, {
      metodo: 'PUT',
      cookie: cenario.gabriel,
      corpo: { funcoes: ['vocal'], ministro: true },
    }),
    200,
    'marcar a Isa como Ministra',
  )
  prova.conferir('a marca de Ministro vai pra quem tem o papel', grupo(comIsa, 'Ministro').some(comecaComIsa))

  const recusa = await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/ana`, {
    metodo: 'PUT',
    cookie: cenario.gabriel,
    corpo: { funcoes: ['vocal'], ministro: true },
  })
  prova.conferir(
    'marcar Ministro em quem não tem o papel devolve 422',
    recusa.status === 422,
    `${recusa.status} · ${recusa.corpo?.erro}`,
  )

  exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/ana`, {
      metodo: 'PUT',
      cookie: cenario.gabriel,
      corpo: { funcoes: ['vocal'] },
    }),
    200,
    'pôr a Ana no vocal',
  )

  exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/julia`, {
      metodo: 'PUT',
      cookie: cenario.gabriel,
      corpo: { funcoes: ['vocal'] },
    }),
    200,
    'pôr a Júlia no vocal',
  )

  const modelo = await escalaPorData(prova, cenario.gabriel, dataDaDemonstracao(MODELO_DE_FORMACAO))
  const formacao = exigir(
    await prova.api('/api/formacoes', {
      cookie: cenario.gabriel,
      corpo: { nome: 'Banda do smoke', escalaId: modelo.id },
    }),
    201,
    'salvar a Formação a partir da Equipe',
  )
  prova.conferir(
    'salvar Formação a partir da Equipe guarda só os Músicos, sem marca de Ministro',
    formacao.entradas.length === 3 && formacao.entradas.every((e: any) => !('ministro' in e)),
    formacao.entradas.map((e: any) => `${e.membroId}: ${e.funcoes.join(', ')}`).join(' | '),
  )
  prova.conferir(
    'a Formação não leva vocal nem som',
    formacao.entradas.every((e: any) => !['isa', 'julia', 'bia', 'davi'].includes(e.membroId)),
  )

  const montada = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/formacao`, {
      cookie: cenario.gabriel,
      corpo: { formacaoId: formacao.id },
    }),
    200,
    'aplicar a Formação',
  )

  prova.conferir(
    'aplicar a Formação monta a Equipe num toque',
    montada.equipe.length >= 6,
    `${montada.equipe.length} na Equipe`,
  )
  prova.conferir('aplicar a Formação preserva a marca de Ministro', grupo(montada, 'Ministro').some(comecaComIsa))
  prova.conferir(
    'a Equipe sai agrupada por grupo',
    ['Ministro', 'Vocal', 'Músicos', 'Som'].every((nome) => grupo(montada, nome).length > 0),
    montada.grupos.map((g: any) => `${g.nome}: ${g.itens.join(', ')}`).join(' | '),
  )
  prova.conferir(
    'o Rafa entrou na Equipe pela Formação',
    montada.equipe.some((e: any) => e.membroId === 'rafa'),
  )
  prova.conferir(
    'aplicar a Formação não mexe em quem já estava no vocal',
    grupo(montada, 'Vocal').includes('Ana') && grupo(montada, 'Vocal').includes('Júlia'),
    grupo(montada, 'Vocal').join(', '),
  )
}

export async function roteiroDoLink(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 2 · Adicionar música colando o link')

  const link = `https://www.youtube.com/watch?v=${VIDEOS.benditoEhORei}`
  const resolvida = await prova.api('/api/musicas/resolver', { cookie: cenario.gabriel, corpo: { link } })

  if (resolvida.status !== 200) {
    throw new Error(
      `O oEmbed do YouTube não respondeu (${resolvida.status}). O smoke precisa de internet para os roteiros 2 a 6.`,
    )
  }

  prova.conferir('colar o link traz título e canal do oEmbed', !!resolvida.corpo.titulo, resolvida.corpo.titulo)
  prova.conferir('o oEmbed traz a capa do vídeo', String(resolvida.corpo.capa ?? '').includes(VIDEOS.benditoEhORei))

  const musicaId =
    resolvida.corpo.musica?.id ??
    exigir(await prova.api('/api/musicas', { cookie: cenario.gabriel, corpo: { link } }), 201, 'criar a Música').id

  cenario.musicas.set(VIDEOS.benditoEhORei, musicaId)

  const escala = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
      cookie: cenario.gabriel,
      corpo: { tipo: 'inteira', musicaId, tom: 'D' },
    }),
    201,
    'adicionar a Música inteira',
  )

  const item = ultimoItem(escala)
  prova.conferir('a Música entra inteira com o Tom escolhido', item.tipo === 'inteira' && item.tom === 'D', item.descricao)
  prova.conferir(
    'ministrado por é preenchido sozinho com o único Ministro',
    item.ministradoPor === 'isa',
    String(item.ministradoPor),
  )

  const detalhe = exigir(
    await prova.api(`/api/musicas/${musicaId}?escalaId=${cenario.escalaDoMes}`, { cookie: cenario.gabriel }),
    200,
    'ler o detalhe da Música',
  )
  prova.conferir(
    'a cobertura mostra que ninguém da Equipe tocou a Música nova',
    detalhe.cobertura.ja.length === 0 && detalhe.cobertura.nunca.length > 0,
    `nunca: ${detalhe.cobertura.nunca.join(', ')}`,
  )
  prova.conferir('o link do Cifra Club vem pelo título', String(detalhe.cifraClub).includes('cifraclub.com.br/?q='))

  const foraDoYoutube = await prova.api('/api/musicas/resolver', {
    cookie: cenario.gabriel,
    corpo: { link: 'https://example.com/musica' },
  })
  prova.conferir('link fora do YouTube devolve 422', foraDoYoutube.status === 422, foraDoYoutube.corpo?.erro)
}

export async function roteiroDoTrecho(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 3 · Adicionar só um Trecho, com minutagem')

  const musicaId = cenario.musicas.get(VIDEOS.sublime)!

  const escala = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
      cookie: cenario.gabriel,
      corpo: { tipo: 'trecho', musicaId, tom: 'A', inicio: '2:10', fim: '4:35' },
    }),
    201,
    'adicionar o Trecho',
  )

  const item = ultimoItem(escala)
  prova.conferir(
    'o Trecho entra com minutagem e Tom próprios',
    item.tipo === 'trecho' && item.inicio === '2:10' && item.fim === '4:35' && item.tom === 'A',
    item.descricao,
  )
  prova.conferir(
    'o link do Trecho abre na minutagem',
    item.link.endsWith(`?t=${segundos('2:10')}`),
    item.link,
  )

  const recusa = await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
    cookie: cenario.gabriel,
    corpo: { tipo: 'trecho', musicaId, tom: 'A', inicio: '1:5', fim: '4:35' },
  })
  prova.conferir('minutagem torta devolve 422', recusa.status === 422, recusa.corpo?.erro)
}

export async function roteiroDoMedley(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 4 · Montar um Medley de 2 Trechos')

  const rio = cenario.musicas.get(VIDEOS.rio)!
  const grato = cenario.musicas.get(VIDEOS.grato)!

  const escala = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
      cookie: cenario.gabriel,
      corpo: {
        tipo: 'medley',
        observacao: 'Solo de guitarra na transição',
        trechos: [
          { musicaId: rio, tom: 'D', inicio: '0:00', fim: '1:40' },
          { musicaId: grato, tom: 'Bb', inicio: '1:20', fim: '3:00' },
        ],
      },
    }),
    201,
    'montar o Medley',
  )

  const item = ultimoItem(escala)
  prova.conferir('o Medley entra com os dois Trechos', item.trechos?.length === 2, item.descricao)
  prova.conferir(
    'cada Trecho do Medley carrega o próprio Tom',
    item.trechos[0].tom === 'D' && item.trechos[1].tom === 'Bb',
    item.trechos.map((t: any) => t.tom).join(' + '),
  )
  prova.conferir('o Medley não tem Tom próprio', item.tom === undefined || item.tom === null)
  prova.conferir(
    'cada Trecho do Medley tem link com a própria minutagem',
    item.trechos[1].link.endsWith(`?t=${segundos('1:20')}`),
    item.trechos[1].link,
  )
  prova.conferir('a observação do Ministro viaja no Item', item.observacao === 'Solo de guitarra na transição')

  const recusa = await prova.api(`/api/escalas/${cenario.escalaDoMes}/itens`, {
    cookie: cenario.gabriel,
    corpo: { tipo: 'medley', trechos: [{ musicaId: rio, tom: 'D', inicio: '0:00', fim: '1:40' }] },
  })
  prova.conferir('Medley de um Trecho só devolve 422', recusa.status === 422, recusa.corpo?.erro)
}

export async function roteiroDaSugestao(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 5 · Promover uma Sugestão')

  const musicaId = cenario.musicas.get(VIDEOS.permanecerei)!
  const sugestao = exigir(
    await prova.api('/api/sugestoes', {
      cookie: cenario.julia,
      corpo: { musicaId, observacao: 'Combina com a abertura' },
    }),
    201,
    'a Júlia sugerir uma Música',
  )

  prova.conferir(
    'quem sugere já conta como o primeiro apoio',
    sugestao.apoios.length === 1 && sugestao.apoios[0].nome === 'Júlia',
    sugestao.apoios.map((a: any) => a.nome).join(', '),
  )

  await prova.api(`/api/sugestoes/${sugestao.id}/apoiar`, { metodo: 'POST', cookie: cenario.isa })
  const apoiada = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/apoiar`, { metodo: 'POST', cookie: cenario.isa }),
    200,
    'apoiar a Sugestão',
  )
  prova.conferir(
    'apoiar duas vezes não duplica',
    apoiada.apoios.length === 2,
    apoiada.apoios.map((a: any) => a.nome).join(', '),
  )

  const promovida = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/promover`, {
      cookie: cenario.gabriel,
      corpo: { escalaId: cenario.escalaDoMes, tom: 'A', observacao: 'Veio da Sugestão da Júlia' },
    }),
    201,
    'promover a Sugestão',
  )

  const item = ultimoItem(promovida.escala)
  const ligacao = consultar(cenario.raiz, `select origem_sugestao_id from itens where id = '${item.id}'`)

  prova.conferir('promover cria o Item na Escala escolhida', item.descricao.includes('Tom A'), item.descricao)
  prova.conferir(
    'o Item guarda de qual Sugestão veio',
    ligacao[0]?.origem_sugestao_id === sugestao.id,
    String(ligacao[0]?.origem_sugestao_id),
  )
  prova.conferir(
    'promover muda o estado pra aceita e guarda a Escala em que entrou',
    promovida.sugestao.estado === 'aceita' && promovida.sugestao.escala?.id === cenario.escalaDoMes,
    `${promovida.sugestao.estado} · ${promovida.sugestao.escala?.titulo}`,
  )

  const mural = exigir(await prova.api('/api/sugestoes', { cookie: cenario.julia }), 200, 'ler o mural')
  const noMural = mural.sugestoes.find((s: any) => s.id === sugestao.id)
  prova.conferir(
    'a Sugestão aceita continua na lista, com a Música trazendo a memória do catálogo',
    noMural?.estado === 'aceita' && typeof noMural?.musica?.aba === 'string',
    `${mural.sugestoes.length} na lista · ${noMural?.musica?.aba}`,
  )

  const denovo = await prova.api(`/api/sugestoes/${sugestao.id}/promover`, {
    cookie: cenario.gabriel,
    corpo: { escalaId: cenario.escalaDoMes, tom: 'A' },
  })
  prova.conferir('promover a mesma Sugestão de novo devolve 409', denovo.status === 409, denovo.corpo?.erro)
}

export async function roteiroDoWhatsapp(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 6 · Gerar o texto pro WhatsApp')

  const escala = await escalaPorData(prova, cenario.gabriel, dataDaDemonstracao(REALIZADA_COM_TRECHO))
  const folha = exigir(
    await prova.api(`/api/escalas/${escala.id}/whatsapp`, { cookie: cenario.gabriel }),
    200,
    'gerar o texto',
  )

  const texto: string = folha.texto
  const grupos = ['Ministro:', 'Vocal:', 'Músicos:', 'Som:']

  prova.conferir(
    'a Equipe sai agrupada por grupo',
    grupos.every((grupo) => texto.includes(grupo)),
    grupos.filter((grupo) => !texto.includes(grupo)).join(', ') || 'os quatro grupos',
  )
  prova.conferir(
    'o Repertório sai numerado com Tom',
    /^1\. .+ · Tom G · /m.test(texto),
    texto.split('\n').find((linha) => linha.startsWith('1. ')),
  )
  prova.conferir('o Trecho sai com a minutagem', texto.includes('(2:10–4:35)'))
  prova.conferir(
    'a observação do Ministro vai junto',
    texto.includes('Obs: Começar mais baixo, diferente do clipe'),
  )
  prova.conferir('a linha da playlist entra no texto', texto.includes('Playlist pra ouvir em loop: https://'))
  prova.conferir('o texto sai inteiro num toque', texto.length > 300, `${texto.length} caracteres`)

  const playlist = exigir(
    await prova.api(`/api/escalas/${escala.id}/playlist`, { cookie: cenario.gabriel }),
    200,
    'gerar a playlist',
  )
  prova.conferir(
    'a playlist leva o Repertório inteiro, validado no oEmbed',
    playlist.videoIds.length === 3 && playlist.videoIds.includes(VIDEOS.sublime),
    playlist.videoIds.join(','),
  )
  prova.conferir('o link da playlist é do YouTube', String(playlist.link).includes('watch_videos?video_ids='))
}

export async function roteiroDeCorrigir(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 7 · Corrigir o domingo passado')

  const escala = await escalaPorData(prova, cenario.gabriel, dataDaDemonstracao(REALIZADA_COM_PEDRO))
  const musicaId = cenario.musicas.get(VIDEOS.firme)!

  prova.conferir('a Escala de agosto está Realizada', escala.estado === 'realizada', escala.estado)

  const antes = exigir(
    await prova.api(`/api/musicas/${musicaId}?escalaId=${escala.id}`, { cookie: cenario.gabriel }),
    200,
    'ler a cobertura antes',
  )
  const pedroAntes = exigir(await prova.api('/api/perfil/pedro', { cookie: cenario.gabriel }), 200, 'perfil do Pedro')
  const rafaAntes = exigir(await prova.api('/api/perfil/rafa', { cookie: cenario.gabriel }), 200, 'perfil do Rafa')

  prova.conferir('antes da correção o Pedro consta como quem tocou', antes.cobertura.ja.includes('Pedro'))

  exigir(
    await prova.api(`/api/escalas/${escala.id}/equipe/pedro`, { metodo: 'DELETE', cookie: cenario.gabriel }),
    200,
    'tirar o Pedro da Escala Realizada',
  )
  const corrigida = exigir(
    await prova.api(`/api/escalas/${escala.id}/equipe/rafa`, {
      metodo: 'PUT',
      cookie: cenario.gabriel,
      corpo: { funcoes: ['baixo'] },
    }),
    200,
    'pôr o Rafa no baixo',
  )

  prova.conferir('editar Escala Realizada é permitido', corrigida.estado === 'realizada', corrigida.estado)

  const depois = exigir(
    await prova.api(`/api/musicas/${musicaId}?escalaId=${escala.id}`, { cookie: cenario.gabriel }),
    200,
    'ler a cobertura depois',
  )
  prova.conferir(
    'as Execuções seguem a Equipe corrigida sozinhas',
    depois.cobertura.ja.includes('Rafa') && !depois.cobertura.ja.includes('Pedro'),
    `já: ${depois.cobertura.ja.join(', ')}`,
  )

  const pedroDepois = exigir(await prova.api('/api/perfil/pedro', { cookie: cenario.gabriel }), 200, 'perfil do Pedro')
  const rafaDepois = exigir(await prova.api('/api/perfil/rafa', { cookie: cenario.gabriel }), 200, 'perfil do Rafa')

  prova.conferir(
    'a presença do Pedro cai com a correção',
    pedroDepois.escalasNoAno === pedroAntes.escalasNoAno - 1,
    `${pedroAntes.escalasNoAno} → ${pedroDepois.escalasNoAno}`,
  )
  prova.conferir(
    'a presença do Rafa sobe com a correção',
    rafaDepois.escalasNoAno === rafaAntes.escalasNoAno + 1,
    `${rafaAntes.escalasNoAno} → ${rafaDepois.escalasNoAno}`,
  )
}

export async function roteiroDeCancelar(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 8 · Cancelar uma Escala')

  const cancelada = exigir(
    await prova.api(`/api/escalas/${cenario.escalaSobrando}/cancelar`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'cancelar a Escala',
  )
  prova.conferir('cancelar leva a Escala pro estado Cancelada', cancelada.estado === 'cancelada', cancelada.estado)

  const desfeita = exigir(
    await prova.api(`/api/escalas/${cenario.escalaSobrando}/desfazer`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'desfazer o cancelamento',
  )
  prova.conferir('desfazer devolve o estado pela data', desfeita.estado === 'agendada', desfeita.estado)

  const realizada = await escalaPorData(prova, cenario.gabriel, dataDaDemonstracao(REALIZADA_COM_TRECHO))
  const musicaId = cenario.musicas.get(VIDEOS.meiaNoite)!
  const antes = exigir(await prova.api(`/api/musicas/${musicaId}`, { cookie: cenario.gabriel }), 200, 'histórico antes')

  exigir(
    await prova.api(`/api/escalas/${realizada.id}/cancelar`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'cancelar a Realizada',
  )
  const durante = exigir(
    await prova.api(`/api/musicas/${musicaId}`, { cookie: cenario.gabriel }),
    200,
    'histórico com a Escala cancelada',
  )
  prova.conferir(
    'Escala Cancelada não gera Execução',
    durante.historico.length === antes.historico.length - 1,
    `${antes.historico.length} → ${durante.historico.length}`,
  )

  exigir(
    await prova.api(`/api/escalas/${realizada.id}/desfazer`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'desfazer o cancelamento da Realizada',
  )
  const depois = exigir(await prova.api(`/api/musicas/${musicaId}`, { cookie: cenario.gabriel }), 200, 'histórico depois')
  prova.conferir(
    'desfazer devolve as Execuções',
    depois.historico.length === antes.historico.length,
    `${depois.historico.length} Execuções`,
  )
}

export async function roteiroDaAvulsa(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 9 · Criar uma Escala uma a uma')

  const data = proximoSabado(cenario.hoje)
  const nova = exigir(
    await prova.api('/api/escalas', {
      cookie: cenario.gabriel,
      corpo: { data, horario: '19:30', rotulo: 'Conferência' },
    }),
    201,
    'criar a Escala',
  )

  prova.conferir('a Escala nasce com nome, data e horário livres', nova.data === data, nova.titulo)
  prova.conferir('a Escala nasce Agendada', nova.estado === 'agendada', nova.estado)

  const recusa = await prova.api('/api/escalas', {
    cookie: cenario.gabriel,
    corpo: { data: '19/09/2026', horario: '19:30', rotulo: 'Conferência' },
  })
  prova.conferir('data fora do formato devolve 422', recusa.status === 422, recusa.corpo?.erro)

  const santaCeia = exigir(
    await prova.api(`/api/escalas/${nova.id}`, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { santaCeia: true, horario: '08:00' },
    }),
    200,
    'marcar Santa Ceia à mão',
  )
  prova.conferir('a marca de Santa Ceia troca o título', santaCeia.titulo.startsWith('Santa Ceia'), santaCeia.titulo)
}

export async function roteiroDaFolhaDoItem(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 11 · Editar o Item pela folha')

  const comMarcos = exigir(
    await prova.api(`/api/escalas/${cenario.escalaDoMes}/equipe/marcos`, {
      metodo: 'PUT',
      cookie: cenario.gabriel,
      corpo: { funcoes: ['vocal'], ministro: true },
    }),
    200,
    'pôr o Marcos como segundo Ministro',
  )
  prova.conferir(
    'uma Escala aceita dois Ministros dividindo a escolha, e o grupo vai pro plural',
    grupo(comMarcos, 'Ministros').length === 2,
    grupo(comMarcos, 'Ministros').join(', '),
  )

  const inteira = comMarcos.itens.find((item: any) => item.tipo === 'inteira')
  const caminho = `/api/escalas/${cenario.escalaDoMes}/itens/${inteira.id}`

  prova.conferir('o Item guarda desde sempre a marca de quando mudou', !!inteira.atualizadoEm, String(inteira.atualizadoEm))

  const comTom = exigir(
    await prova.api(caminho, { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { tom: 'E' } }),
    200,
    'trocar o Tom pela folha',
  )
  const comTomAtual = itemPorId(comTom, inteira.id)
  prova.conferir(
    'trocar o Tom pela folha marca o Item como mudado',
    comTomAtual.tom === 'E' && comTomAtual.atualizadoEm > inteira.atualizadoEm,
    `Tom ${comTomAtual.tom} · ${comTomAtual.atualizadoEm}`,
  )

  const semMinutagem = await prova.api(caminho, { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { tipo: 'trecho' } })
  prova.conferir('virar Trecho sem minutagem devolve 422', semMinutagem.status === 422, semMinutagem.corpo?.erro)

  const virouTrecho = exigir(
    await prova.api(caminho, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: { tipo: 'trecho', inicio: '1:12', fim: '3:20' },
    }),
    200,
    'virar Trecho pela folha',
  )
  const trechoAtual = itemPorId(virouTrecho, inteira.id)
  prova.conferir(
    'a Música inteira vira Trecho com minutagem e link na hora certa',
    trechoAtual.tipo === 'trecho' && trechoAtual.inicio === '1:12' && trechoAtual.link.endsWith(`?t=${segundos('1:12')}`),
    trechoAtual.descricao,
  )

  const voltouInteira = exigir(
    await prova.api(caminho, { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { tipo: 'inteira' } }),
    200,
    'voltar a Música inteira',
  )
  const inteiraDeNovo = itemPorId(voltouInteira, inteira.id)
  prova.conferir(
    'voltar pra Música inteira apaga a minutagem',
    inteiraDeNovo.tipo === 'inteira' && !inteiraDeNovo.inicio && !inteiraDeNovo.fim,
    inteiraDeNovo.descricao,
  )

  const naoEhMinistro = await prova.api(caminho, {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { ministradoPor: 'ana' },
  })
  prova.conferir('quem puxa só pode ser Ministro daquela Escala', naoEhMinistro.status === 422, naoEhMinistro.corpo?.erro)

  const comQuemPuxa = exigir(
    await prova.api(caminho, { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { ministradoPor: 'marcos' } }),
    200,
    'escolher quem puxa',
  )
  const puxado = itemPorId(comQuemPuxa, inteira.id)
  prova.conferir(
    'com dois Ministros a folha escolhe quem puxa o Item',
    puxado.ministradoPor === 'marcos' && puxado.ministradoPorNome === 'Marcos',
    String(puxado.ministradoPorNome),
  )

  const reordenado = exigir(
    await prova.api(caminho, { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { ordem: 0 } }),
    200,
    'reordenar o Item',
  )
  const primeiro = reordenado.itens[0]
  prova.conferir(
    'reordenar muda a posição sem marcar o Item como mudado',
    primeiro.id === inteira.id && primeiro.atualizadoEm === puxado.atualizadoEm,
    `${primeiro.descricao} · ${primeiro.atualizadoEm}`,
  )

  const medley = reordenado.itens.find((item: any) => item.tipo === 'medley')
  const caminhoDoMedley = `/api/escalas/${cenario.escalaDoMes}/itens/${medley.id}`
  const outrasMusicas = await prova.api(caminhoDoMedley, {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: {
      trechos: [
        { musicaId: cenario.musicas.get(VIDEOS.firme), tom: 'C', inicio: '0:00', fim: '1:40' },
        { musicaId: cenario.musicas.get(VIDEOS.grato), tom: 'Bb', inicio: '1:20', fim: '3:00' },
      ],
    },
  })
  prova.conferir(
    'trocar as músicas do Medley pela folha devolve 422',
    outrasMusicas.status === 422,
    outrasMusicas.corpo?.erro,
  )

  const afinado = exigir(
    await prova.api(caminhoDoMedley, {
      metodo: 'PATCH',
      cookie: cenario.gabriel,
      corpo: {
        trechos: [
          { musicaId: cenario.musicas.get(VIDEOS.rio), tom: 'E', inicio: '0:00', fim: '2:00' },
          { musicaId: cenario.musicas.get(VIDEOS.grato), tom: 'Bb', inicio: '1:20', fim: '3:00' },
        ],
      },
    }),
    200,
    'afinar os Trechos do Medley',
  )
  const medleyAtual = itemPorId(afinado, medley.id)
  prova.conferir(
    'a folha do Medley muda Tom e minutagem de cada Trecho',
    medleyAtual.trechos[0].tom === 'E' && medleyAtual.trechos[0].fim === '2:00',
    medleyAtual.descricao,
  )
  prova.conferir(
    'cada Trecho do Medley traz a memória da própria Música',
    medleyAtual.trechos.every((trecho: any) => trecho.memoria && 'recente' in trecho.memoria),
    medleyAtual.trechos.map((t: any) => `${t.musica.titulo}: ${t.memoria?.recente ? 'recente' : 'sem repetição'}`).join(' | '),
  )
}

export async function roteiroDasPendencias(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 12 · Mínimo por Função, pendências e Início de quem dirige')

  const funcoes = exigir(await prova.api('/api/funcoes', { cookie: cenario.isa }), 200, 'listar as Funções')
  const porId = new Map<string, any>(funcoes.funcoes.map((funcao: any) => [funcao.id, funcao]))

  prova.conferir(
    'as Funções dizem o mínimo que cada Escala precisa ter',
    porId.get('vocal').minimo === 2 && porId.get('bateria').minimo === 1 && porId.get('teclado').minimo === 0,
    funcoes.funcoes.map((f: any) => `${f.nome} ${f.minimo}`).join(' · '),
  )

  const pronta = await escalaPorRotulo(prova, cenario.isa, 'Culto desta semana')
  prova.conferir(
    'a Escala com Equipe completa e Repertório aparece pronta',
    pronta.pronta === true && pronta.pendencias.length === 0,
    pronta.porGrupo.map((g: any) => g.texto).join(' · '),
  )

  const semMinistro = await escalaPorRotulo(prova, cenario.isa, 'Culto sem ministro')
  prova.conferir(
    'Escala sem ninguém dirigindo fica pendente',
    semMinistro.pendencias.some((p: any) => p.chave === 'sem-ministro'),
    semMinistro.pendencias.map((p: any) => p.texto).join(', '),
  )

  const semBateria = await escalaPorRotulo(prova, cenario.isa, 'Culto sem baterista')
  prova.conferir(
    'a falta de uma Função sai com o nome dela e a contagem',
    semBateria.pendencias.some((p: any) => p.chave === 'falta-funcao' && p.texto === 'falta 1 bateria'),
    semBateria.pendencias.map((p: any) => p.texto).join(', '),
  )
  prova.conferir(
    'o resumo por grupo diz quantos são e quem falta',
    semBateria.porGrupo.find((g: any) => g.grupo === 'instrumentos')?.faltam.includes('bateria'),
    semBateria.porGrupo.map((g: any) => g.texto).join(' · '),
  )

  const semMusicas = await escalaPorRotulo(prova, cenario.isa, 'Culto sem músicas')
  prova.conferir(
    'Escala sem Repertório fica pendente',
    semMusicas.pendencias.some((p: any) => p.chave === 'sem-musicas'),
    semMusicas.pendencias.map((p: any) => p.texto).join(', '),
  )

  const foraDaFaixa = await prova.api('/api/admin/funcoes/teclado', {
    metodo: 'PATCH',
    cookie: cenario.gabriel,
    corpo: { minimo: 5 },
  })
  prova.conferir('mínimo fora de 0 a 4 devolve 422', foraDaFaixa.status === 422, foraDaFaixa.corpo?.erro)

  exigir(
    await prova.api('/api/admin/funcoes/teclado', { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { minimo: 2 } }),
    200,
    'passar a cobrar dois teclados',
  )
  const cobrando = await escalaPorRotulo(prova, cenario.isa, 'Culto desta semana')
  prova.conferir(
    'subir o mínimo de uma Função no Admin faz a Escala pronta virar pendente',
    cobrando.pronta === false && cobrando.pendencias.some((p: any) => p.texto === 'faltam 2 teclados'),
    cobrando.pendencias.map((p: any) => p.texto).join(', '),
  )

  exigir(
    await prova.api('/api/admin/funcoes/teclado', { metodo: 'PATCH', cookie: cenario.gabriel, corpo: { minimo: 0 } }),
    200,
    'voltar a não cobrar teclado',
  )
  const semCobrar = await escalaPorRotulo(prova, cenario.isa, 'Culto desta semana')
  prova.conferir(
    'mínimo zero não cobra a Função de ninguém',
    semCobrar.pronta === true,
    semCobrar.porGrupo.map((g: any) => g.texto).join(' · '),
  )

  const inicio = exigir(await prova.api('/api/inicio', { cookie: cenario.isa }), 200, 'abrir o Início de quem dirige')

  prova.conferir(
    'o cartão pós-culto aparece no dia seguinte ao culto, com as músicas registradas',
    String(inicio.posCulto?.titulo).startsWith('Culto de ontem') && inicio.posCulto.itens === 5,
    `${inicio.posCulto?.titulo} · ${inicio.posCulto?.itens} músicas`,
  )

  const rotulosPendentes: string[] = inicio.pendencias.map((escala: any) => escala.rotulo)
  prova.conferir(
    'o Início junta as pendências das próximas semanas numa resposta só',
    ['Culto sem ministro', 'Culto sem baterista', 'Culto sem músicas'].every((rotulo) =>
      rotulosPendentes.includes(rotulo),
    ),
    rotulosPendentes.join(', '),
  )
  prova.conferir(
    'a Escala pronta fica fora das pendências',
    !rotulosPendentes.includes('Culto desta semana'),
    `${inicio.pendencias.length} pendentes`,
  )
  prova.conferir(
    'o Início abre pela própria escala, com Equipe e Repertório já montados',
    !!inicio.minhaProxima &&
      inicio.minhaProxima.equipe.some((entrada: any) => entrada.membroId === 'isa') &&
      inicio.minhaProxima.pessoas.length > 0,
    `${inicio.minhaProxima?.titulo} · ${inicio.minhaProxima?.pessoas.length} na Equipe`,
  )
  prova.conferir(
    'o Início traz o limite de repetição e os anexos sem outra requisição',
    Number.isInteger(inicio.semanasDeRepeticao) && !!inicio.anexosPorDono,
    `${inicio.semanasDeRepeticao} semanas`,
  )

  const semSessao = await prova.api('/api/inicio')
  prova.conferir('o Início sem sessão devolve 401', semSessao.status === 401, semSessao.corpo?.erro)
}

function comecaComIsa(pessoa: string): boolean {
  return pessoa === 'Isa' || pessoa.startsWith('Isa (')
}
