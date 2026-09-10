import type {
  Cobertura,
  ExecucaoApresentada,
  MusicaNaLista,
  MusicaResumida,
  Resolucao,
  SugestaoApresentada,
  TomSugeridoApresentado,
} from '../api/tipos'
import { capaAlternativa, capaDaMusica, ehMinutagem, formatarDia, videoIdDoLink } from '../dominio'
import { textoDoUltimoTom } from '../musicas/catalogo'

export type ModoDoItem = 'inteira' | 'trecho'

export type Escolha = {
  musicaId: string | null
  link: string | null
  resumo: MusicaResumida
}

export type Rascunho = {
  escolha: Escolha
  tom: string | null
  tomOriginal: string | null
  modo: ModoDoItem
  inicio: string
  fim: string
  observacao: string
}

export type TrechoEmMontagem = {
  escolha: Escolha
  tom: string | null
  inicio: string
  fim: string
}

export type TrechoPronto = {
  musicaId: string
  tom: string
  inicio: string
  fim: string
}

export function escolhaDaMusica(musica: MusicaResumida): Escolha {
  return { musicaId: musica.id, link: null, resumo: resumir(musica) }
}

export function escolhaDoLink(resolucao: Resolucao, link: string): Escolha {
  if (resolucao.musica) return escolhaDaMusica(resolucao.musica)

  return {
    musicaId: null,
    link,
    resumo: {
      id: resolucao.videoId,
      titulo: resolucao.titulo,
      artista: resolucao.canal,
      videoId: resolucao.videoId,
      capa: resolucao.capa,
      capaAlternativa: resolucao.capaAlternativa,
    },
  }
}

export function escolhaDaSugestao(sugestao: SugestaoApresentada): Escolha {
  if (sugestao.musica) return escolhaDaMusica(sugestao.musica)

  const videoId = videoIdDoLink(sugestao.link) ?? ''

  return {
    musicaId: null,
    link: sugestao.link,
    resumo: {
      id: videoId,
      titulo: sugestao.titulo,
      artista: '',
      videoId,
      capa: capaDaMusica(videoId),
      capaAlternativa: capaAlternativa(videoId),
    },
  }
}

export function rascunhoDe(escolha: Escolha, sugerido: TomSugeridoApresentado | null): Rascunho {
  return { escolha, tom: sugerido?.tom ?? null, tomOriginal: null, modo: 'inteira', inicio: '', fim: '', observacao: '' }
}

export function trechoDe(
  escolha: Escolha,
  sugerido: TomSugeridoApresentado | null,
  primeiro: boolean,
): TrechoEmMontagem {
  return { escolha, tom: sugerido?.tom ?? null, inicio: primeiro ? '0:00' : '', fim: '' }
}

export function rascunhoPronto(rascunho: Rascunho): boolean {
  if (!rascunho.tom) return false
  if (rascunho.modo === 'inteira') return true
  return ehMinutagem(rascunho.inicio) && ehMinutagem(rascunho.fim)
}

export function trechoPronto(trecho: TrechoEmMontagem): boolean {
  return !!trecho.tom && ehMinutagem(trecho.inicio) && ehMinutagem(trecho.fim)
}

export function medleyPronto(trechos: TrechoEmMontagem[]): boolean {
  return trechos.length >= 2 && trechos.every(trechoPronto)
}

export function linksPendentes(trechos: TrechoEmMontagem[]): string[] {
  return [...new Set(trechos.map((trecho) => trecho.escolha.link).filter((link) => link !== null))]
}

export function trechosComMusica(trechos: TrechoEmMontagem[], idPorLink: Record<string, string>): TrechoPronto[] {
  return trechos.map((trecho) => ({
    musicaId: trecho.escolha.musicaId ?? idPorLink[trecho.escolha.link ?? ''],
    tom: trecho.tom ?? '',
    inicio: trecho.inicio,
    fim: trecho.fim,
  }))
}

export function corpoDoItem(rascunho: Rascunho, musicaId: string) {
  const comum = { musicaId, tom: rascunho.tom ?? '', observacao: rascunho.observacao.trim() }

  if (rascunho.modo === 'inteira') return { tipo: 'inteira', ...comum }

  return { tipo: 'trecho', ...comum, inicio: rascunho.inicio, fim: rascunho.fim }
}

export function corpoDaPromocao(rascunho: Rascunho, escalaId: string) {
  const comum = { escalaId, tom: rascunho.tom ?? '', observacao: rascunho.observacao.trim() }

  if (rascunho.modo === 'inteira') return { tipo: 'inteira', ...comum }

  return { tipo: 'trecho', ...comum, inicio: rascunho.inicio, fim: rascunho.fim }
}

export function corpoDoMedley(trechos: TrechoPronto[], observacao: string) {
  return { tipo: 'medley', trechos, observacao: observacao.trim() }
}

export function textoDoTomSugerido(sugerido: TomSugeridoApresentado | null): string {
  if (!sugerido) return 'Sem tom de partida: escolha.'

  return textoDoUltimoTom(sugerido) + ' Já selecionado.'
}

export function textoDoHistorico(historico: ExecucaoApresentada[]): string {
  return historico
    .map((execucao) => {
      const quem = execucao.ministradoPorNome ? ` (${execucao.ministradoPorNome})` : ''
      return `${execucao.tom} em ${formatarDia(execucao.data)}${quem}${execucao.parcial ? ', trecho' : ''}`
    })
    .join(' · ')
}

export function textoDaCobertura(cobertura: Cobertura | null): string {
  if (!cobertura) return ''

  const ja = cobertura.ja.length
    ? `${cobertura.ja.join(', ')} já ${cobertura.ja.length > 1 ? 'tocaram' : 'tocou'}`
    : 'Ninguém da Equipe tocou ainda'

  return ja + (cobertura.nunca.length ? ` · ${cobertura.nunca.join(', ')} nunca` : '') + '.'
}

export function descricaoNaLista(musica: MusicaNaLista): string {
  if (!musica.ultimaExecucao) return musica.artista

  const parcial = musica.ultimaExecucao.parcial ? ' (trecho)' : ''

  return `${musica.artista} · última ${formatarDia(musica.ultimaExecucao.data)}${parcial}`
}

export function seloDaMusica(musica: MusicaNaLista): 'legado' | 'nova' | null {
  if (musica.legado) return 'legado'
  if (musica.nova) return 'nova'
  return null
}

function resumir(musica: MusicaResumida): MusicaResumida {
  return {
    id: musica.id,
    titulo: musica.titulo,
    artista: musica.artista,
    videoId: musica.videoId,
    capa: musica.capa,
    capaAlternativa: musica.capaAlternativa,
  }
}
