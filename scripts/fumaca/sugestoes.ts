import { VIDEOS, exigir } from './cenario'
import type { Cenario } from './cenario'
import type { Prova } from './prova'

export async function roteiroDeSugestoes(prova: Prova, cenario: Cenario): Promise<void> {
  prova.grupo('Roteiro 10 · Sugestões: guardar, reabrir, recusar e sugerir de novo')

  const musicaId = cenario.musicas.get(VIDEOS.firme)!

  const sugestao = exigir(
    await prova.api('/api/sugestoes', {
      cookie: cenario.julia,
      corpo: { musicaId, observacao: 'Pra fechar o culto' },
    }),
    201,
    'a Júlia sugerir a música',
  )
  prova.conferir('a Sugestão nasce aberta', sugestao.estado === 'aberta', sugestao.estado)

  const apoiada = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/apoiar`, { metodo: 'POST', cookie: cenario.isa }),
    200,
    'a Isa apoiar',
  )
  prova.conferir(
    'o apoio da Isa entra na lista',
    apoiada.apoios.some((a: any) => a.id === 'isa'),
    apoiada.apoios.map((a: any) => a.nome).join(', '),
  )

  const guardada = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/guardar`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'guardar a Sugestão',
  )
  prova.conferir(
    'guardar muda o estado e marca quem decidiu',
    guardada.estado === 'guardada' && guardada.decididaPor?.id === 'gabriel',
    `${guardada.estado} · ${guardada.decididaPor?.nome}`,
  )

  const reaberta = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/reabrir`, { metodo: 'POST', cookie: cenario.gabriel }),
    200,
    'reabrir a Sugestão',
  )
  prova.conferir(
    'reabrir devolve pra aberta e limpa a decisão',
    reaberta.estado === 'aberta' && reaberta.decididaEm === null,
    reaberta.estado,
  )

  const recusada = exigir(
    await prova.api(`/api/sugestoes/${sugestao.id}/recusar`, {
      metodo: 'POST',
      cookie: cenario.gabriel,
      corpo: { motivo: 'Já tocamos parecida esse mês' },
    }),
    200,
    'recusar a Sugestão',
  )
  prova.conferir(
    'recusar grava o motivo',
    recusada.estado === 'recusada' && recusada.motivo === 'Já tocamos parecida esse mês',
    `${recusada.estado} · ${recusada.motivo}`,
  )

  const reabrirRecusada = await prova.api(`/api/sugestoes/${sugestao.id}/reabrir`, {
    metodo: 'POST',
    cookie: cenario.gabriel,
  })
  prova.conferir(
    'transição proibida: reabrir uma Sugestão recusada devolve 409',
    reabrirRecusada.status === 409,
    reabrirRecusada.corpo?.erro,
  )

  const denovo = exigir(
    await prova.api('/api/sugestoes', {
      cookie: cenario.julia,
      corpo: { musicaId, observacao: 'Segunda tentativa' },
    }),
    201,
    'sugerir de novo a mesma música, permitido porque a anterior foi recusada',
  )
  prova.conferir('a nova Sugestão nasce aberta', denovo.estado === 'aberta', denovo.estado)

  const duplicata = await prova.api('/api/sugestoes', {
    cookie: cenario.isa,
    corpo: { musicaId, observacao: 'Terceira tentativa' },
  })
  prova.conferir(
    'sugerir a mesma música enquanto a nova está aberta devolve 409 com o id de quem apoiar',
    duplicata.status === 409 && duplicata.corpo?.sugestaoId === denovo.id,
    `${duplicata.status} · ${duplicata.corpo?.erro}`,
  )

  const promovida = exigir(
    await prova.api(`/api/sugestoes/${denovo.id}/promover`, {
      cookie: cenario.gabriel,
      corpo: { escalaId: cenario.escalaDoMes, tom: 'D' },
    }),
    201,
    'promover a nova Sugestão',
  )
  prova.conferir(
    'promover muda o estado pra aceita, na Escala do mês',
    promovida.sugestao.estado === 'aceita' && promovida.sugestao.escala?.id === cenario.escalaDoMes,
    `${promovida.sugestao.estado} · ${promovida.sugestao.escala?.titulo}`,
  )
}
