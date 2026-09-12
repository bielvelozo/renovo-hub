import { VIDEOS, exigir } from './cenario'
import type { Cenario } from './cenario'
import type { Prova } from './prova'

export async function fluxosDoMembro(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Membro · Início')

  const eu = exigir(await prova.api('/api/eu', { cookie: cenario.julia }), 200, 'ler quem sou')
  prova.conferir(
    'o Membro comum se reconhece e não é Ministro nem Admin',
    eu.nome === 'Júlia' && !eu.ministro && !eu.admin,
    `${eu.nome} · funções: ${eu.funcoes.join(', ')}`,
  )

  const doMes = exigir(
    await prova.api(`/api/escalas?mes=${cenario.mesDeTrabalho}`, { cookie: cenario.julia }),
    200,
    'listar as Escalas do mês',
  )
  const minha = doMes.escalas.find((escala: any) => escala.membros.includes('julia'))
  prova.conferir('o Membro acha a própria próxima Escala na lista', !!minha, minha?.titulo)

  const semJulia = doMes.escalas.find((escala: any) => !escala.membros.includes('julia'))
  prova.conferir(
    'a lista do mês diz a Função da pessoa em cada Escala',
    minha.minhasFuncoes.includes('Vocal') && semJulia.minhasFuncoes.length === 0,
    `${minha.titulo}: ${minha.minhasFuncoes.join(', ')} · ${semJulia.titulo}: sem Função`,
  )

  const inicio = exigir(await prova.api('/api/inicio', { cookie: cenario.julia }), 200, 'abrir o Início')
  prova.conferir(
    'o Início do Membro abre numa requisição só, já pela própria escala',
    inicio.minhaProxima?.id === minha.id && inicio.minhaProxima.pessoas.length > 0,
    `${inicio.minhaProxima?.titulo} · ${inicio.minhaProxima?.pessoas.length} na Equipe`,
  )
  prova.conferir(
    'quem não dirige não vê pendências, cartão pós-culto nem criar mês',
    inicio.pendencias.length === 0 && inicio.posCulto === null && inicio.proximoMesVazio === null,
    `${inicio.pendencias.length} pendências`,
  )
  prova.conferir(
    'o Repertório do Início já vem com a memória de cada Música e o resumo',
    inicio.minhaProxima.itens.every((item: any) => item.tipo === 'medley' || item.memoria) &&
      inicio.minhaProxima.resumoDoRepertorio.total > 0,
    JSON.stringify(inicio.minhaProxima.resumoDoRepertorio),
  )

  const escala = exigir(await prova.api(`/api/escalas/${minha.id}`, { cookie: cenario.julia }), 200, 'abrir a Escala')
  const naEquipe = escala.equipe.find((entrada: any) => entrada.membroId === 'julia')

  prova.conferir('a tela do Membro sabe a Função dele na Escala', !!naEquipe?.funcoes.length, naEquipe?.funcoes.join(', '))
  prova.conferir(
    'quem dirige a Escala abre a Equipe',
    escala.grupos[0].nome.startsWith('Ministro'),
    `${escala.grupos[0].nome}: ${escala.grupos[0].itens.join(', ')}`,
  )
  prova.conferir(
    'os Itens vêm com capa, Tom e link',
    escala.itens.every((item: any) => item.tipo === 'medley' || (item.musica?.capa && item.link)),
    `${escala.itens.length} Itens`,
  )
  prova.conferir(
    'o Medley vem com os Trechos encadeados, cada um com o seu link',
    escala.itens
      .filter((item: any) => item.tipo === 'medley')
      .every((item: any) => item.trechos.every((t: any) => t.link && t.tom)),
  )

  const anexos = exigir(
    await prova.api(`/api/escalas/${minha.id}/anexos`, { cookie: cenario.julia }),
    200,
    'listar os anexos da Escala',
  )
  prova.conferir('a rota de anexos da Escala responde numa chamada só', Array.isArray(anexos.anexos))

  const folha = exigir(
    await prova.api(`/api/escalas/${minha.id}/whatsapp`, { cookie: cenario.julia }),
    200,
    'o Membro gera o texto pro WhatsApp',
  )
  prova.conferir('o Membro também tira o texto pro WhatsApp', folha.texto.includes('Repertório:'))

  prova.grupo('Membro · Músicas')

  const catalogo = exigir(await prova.api('/api/musicas', { cookie: cenario.julia }), 200, 'listar o catálogo')
  const musicas: any[] = catalogo.musicas

  prova.conferir(
    'a lista vem com o limite de repetição do Admin',
    [2, 4, 6, 8].includes(catalogo.semanasDeRepeticao),
    `${catalogo.semanasDeRepeticao} semanas`,
  )
  prova.conferir(
    'toda Música traz aba e seção coerentes',
    musicas.every(
      (m) =>
        (m.aba === 'redescobrir' && (m.secao === 'nunca' || m.secao === 'paradas')) ||
        (m.aba === 'recentes' && m.secao === null),
    ),
    `${musicas.length} Músicas`,
  )
  prova.conferir(
    'quem nunca foi tocada no app está em Redescobrir, na seção nunca',
    musicas.some((m) => m.secao === 'nunca') &&
      musicas.filter((m) => !m.ultimaExecucao).every((m) => m.aba === 'redescobrir' && m.secao === 'nunca'),
    `${musicas.filter((m) => m.secao === 'nunca').length} nunca tocadas`,
  )
  prova.conferir(
    'recente só vale pra quem tem Execução e está em Recentes',
    musicas.every((m) => !m.recente || (m.aba === 'recentes' && !!m.ultimaExecucao)),
    `${musicas.filter((m) => m.recente).length} recentes`,
  )

  const planejada = musicas.find((m) => m.videoId === VIDEOS.permanecerei)
  prova.conferir(
    'a Música promovida pela Sugestão aparece planejada na Escala do mês',
    planejada?.planejadaEm.some((p: any) => p.escalaId === cenario.escalaDoMes && p.ministros.includes('Isa')),
    planejada?.planejadaEm.map((p: any) => `${p.titulo} · ${p.data}`).join(' | '),
  )

  const semAAtual = exigir(
    await prova.api(`/api/musicas?escalaId=${cenario.escalaDoMes}`, { cookie: cenario.julia }),
    200,
    'listar excluindo a Escala atual',
  )
  prova.conferir(
    'com escalaId, a própria Escala sai de planejadaEm',
    !semAAtual.musicas
      .find((m: any) => m.videoId === VIDEOS.permanecerei)
      ?.planejadaEm.some((p: any) => p.escalaId === cenario.escalaDoMes),
  )

  const busca = exigir(await prova.api('/api/musicas?busca=afeicao', { cookie: cenario.julia }), 200, 'busca')
  prova.conferir(
    'a busca ignora acento e caixa',
    busca.musicas.some((m: any) => m.videoId === VIDEOS.dono),
    busca.musicas.map((m: any) => m.titulo).join(', '),
  )

  const detalhe = exigir(
    await prova.api(`/api/musicas/${cenario.musicas.get(VIDEOS.meiaNoite)}`, { cookie: cenario.julia }),
    200,
    'abrir o detalhe da Música',
  )
  prova.conferir(
    'o detalhe traz o histórico com quem ministrou',
    detalhe.historico.length > 0 && detalhe.historico.every((e: any) => e.data && e.tom),
    detalhe.historico.map((e: any) => `${e.tom} em ${e.data} (${e.ministradoPorNome})`).join(' · '),
  )
  prova.conferir('o detalhe sugere o último Tom', !!detalhe.tomSugerido?.tom, JSON.stringify(detalhe.tomSugerido))

  prova.grupo('Membro · Sugestões e Perfil')

  const minhaSugestao = exigir(
    await prova.api('/api/sugestoes', {
      cookie: cenario.julia,
      corpo: { link: `https://youtu.be/${VIDEOS.emTeusBracos}`, titulo: 'Em Teus Braços', observacao: 'Pro fim' },
    }),
    201,
    'sugerir por link',
  )
  prova.conferir(
    'sugerir por link de vídeo que já está no catálogo vira Sugestão da Música',
    !!minhaSugestao.musica,
    minhaSugestao.titulo,
  )

  const apoiada = exigir(
    await prova.api(`/api/sugestoes/${minhaSugestao.id}/apoiar`, { metodo: 'POST', cookie: cenario.isa }),
    200,
    'apoiar',
  )
  prova.conferir('apoiar entra na lista de apoios', apoiada.apoios.length === 2, apoiada.apoios.map((a: any) => a.nome).join(', '))

  const desapoiada = exigir(
    await prova.api(`/api/sugestoes/${minhaSugestao.id}/apoiar`, { metodo: 'DELETE', cookie: cenario.isa }),
    200,
    'desapoiar',
  )
  prova.conferir('desapoiar sai da lista', desapoiada.apoios.length === 1)

  const alheia = await prova.api(`/api/sugestoes/${minhaSugestao.id}`, { metodo: 'DELETE', cookie: cenario.isa })
  prova.conferir('Ministro não apaga Sugestão alheia', alheia.status === 403, alheia.corpo?.erro)

  const apagada = exigir(
    await prova.api(`/api/sugestoes/${minhaSugestao.id}`, { metodo: 'DELETE', cookie: cenario.julia }),
    200,
    'apagar a própria Sugestão',
  )
  prova.conferir('quem sugeriu apaga a própria Sugestão', apagada.apagada === true)

  const perfil = exigir(await prova.api('/api/perfil/julia', { cookie: cenario.julia }), 200, 'abrir o Perfil')
  prova.conferir(
    'o Perfil traz Escalas no ano, última Escala e fins de semana seguidos',
    Number.isInteger(perfil.escalasNoAno) && !!perfil.ultimaEscala && Number.isInteger(perfil.finsDeSemanaSeguidos),
    `${perfil.escalasNoAno} no ano · última ${perfil.ultimaEscala?.titulo} · ${perfil.textoDeFinsDeSemana}`,
  )
  const comSequencia = exigir(await prova.api('/api/perfil/gabriel', { cookie: cenario.julia }), 200, 'perfil com sequência')
  prova.conferir(
    'os fins de semana seguidos saem por extenso, e somem quando são zero',
    /^\d+ (fim de semana seguido|fins de semana seguidos)$/.test(comSequencia.textoDeFinsDeSemana) &&
      (perfil.finsDeSemanaSeguidos > 0) === (perfil.textoDeFinsDeSemana !== null),
    `Gabriel: ${comSequencia.textoDeFinsDeSemana} · Júlia: ${perfil.textoDeFinsDeSemana}`,
  )

  const tecnico = exigir(await prova.api('/api/perfil/davi', { cookie: cenario.julia }), 200, 'perfil do técnico')
  prova.conferir(
    'a Função técnica conta presença mesmo sem creditar Execução',
    tecnico.escalasNoAno > 0,
    `${tecnico.escalasNoAno} Escalas no ano`,
  )

  prova.grupo('Membro · Portão de papel')

  const semPapel = await prova.api('/api/escalas/mes', { cookie: cenario.julia, corpo: { mes: '2027-01' } })
  prova.conferir('Membro comum não cria Escala', semPapel.status === 403, semPapel.corpo?.erro)

  const noAdmin = await prova.api('/api/admin/membros', { cookie: cenario.julia })
  prova.conferir('Membro comum não entra no Admin', noAdmin.status === 403, noAdmin.corpo?.erro)

  const semCookie = await prova.api('/api/eu')
  prova.conferir('sem sessão a API devolve 401', semCookie.status === 401, semCookie.corpo?.erro)
}
