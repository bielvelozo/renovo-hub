import type { EscalaApresentada, ItemApresentado, MemoriaApresentada, MusicaResumida } from '../api/tipos'
import type { PessoaDaEquipe, ResumoDoRepertorio } from '../dominio'
import { formatarDiaNumerico, tempoRelativo } from '../dominio'

const MAXIMO_DE_CAPAS = 4
const MAXIMO_DE_PLANEJADAS = 2

export function tituloDoItem(item: ItemApresentado): string {
  return item.tipo === 'medley' ? 'Medley' : item.musica.titulo
}

export function resumoDoItem(item: ItemApresentado): string {
  if (item.tipo === 'medley') {
    return item.trechos
      .map((trecho) => `${trecho.musica.titulo} ${trecho.inicio}–${trecho.fim} · Tom ${trecho.tom}`)
      .join(' + ')
  }

  const minutagem = item.tipo === 'trecho' ? `${item.inicio}–${item.fim} · ` : ''

  return minutagem + 'Tom ' + item.tom
}

export function capasDoItem(item: ItemApresentado): MusicaResumida[] {
  if (item.tipo === 'medley') return item.trechos.slice(0, MAXIMO_DE_CAPAS).map((trecho) => trecho.musica)
  return [item.musica]
}

export function videosDoRepertorio(itens: ItemApresentado[]): string[] {
  return itens.flatMap((item) =>
    item.tipo === 'medley' ? item.trechos.map((trecho) => trecho.musica.videoId) : [item.musica.videoId],
  )
}

export type SeloDoEstado = {
  chave: string
  texto: string
  variante: 'atencao' | 'sucesso' | 'cancelada'
}

export type SeloDaMemoria = { chave: string; texto: string }

export function selosDeEstado(escala: EscalaApresentada, dirige: boolean): SeloDoEstado[] {
  if (escala.estado === 'cancelada') return [{ chave: 'cancelada', texto: 'cancelada', variante: 'cancelada' }]
  if (!dirige || escala.estado !== 'agendada') return []

  const selos: SeloDoEstado[] = escala.pronta
    ? [
        { chave: 'equipe', texto: 'equipe completa', variante: 'sucesso' },
        { chave: 'musicas', texto: contar(escala.itens.length, 'música', 'músicas'), variante: 'sucesso' },
      ]
    : escala.pendencias.map((pendencia) => ({
        chave: pendencia.chave + (pendencia.funcaoId ?? ''),
        texto: pendencia.texto,
        variante: 'atencao' as const,
      }))

  if (escala.resumoDoRepertorio.recentes > 0) {
    selos.push({
      chave: 'recentes',
      texto: contar(escala.resumoDoRepertorio.recentes, 'repetição recente', 'repetições recentes'),
      variante: 'atencao',
    })
  }

  return selos
}

export function textoDoResumoDoRepertorio(resumo: ResumoDoRepertorio): string {
  return [
    resumo.recentes && contar(resumo.recentes, 'recente', 'recentes'),
    resumo.antigas && contar(resumo.antigas, 'há mais de 6 meses', 'há mais de 6 meses'),
    resumo.nuncaTocadas && contar(resumo.nuncaTocadas, 'nunca tocada', 'nunca tocadas'),
  ]
    .filter(Boolean)
    .join(' · ')
}

export function selosDaMemoria(memoria: MemoriaApresentada | null, hoje: string): SeloDaMemoria[] {
  if (!memoria) return []

  const selos: SeloDaMemoria[] = []
  const ultima = memoria.ultimaExecucao

  if (memoria.recente && ultima) {
    const quem = ultima.ministradoPorNome ? ` · ${ultima.ministradoPorNome}` : ''
    selos.push({ chave: 'recente', texto: `tocada ${tempoRelativo(ultima.data, hoje)}${quem}` })
  }

  for (const planejada of memoria.planejadaEm.slice(0, MAXIMO_DE_PLANEJADAS)) {
    selos.push({ chave: planejada.escalaId, texto: `também dia ${formatarDiaNumerico(planejada.data)}` })
  }

  return selos
}

export function textoDeQuemPuxa(item: ItemApresentado, quantosMinistros: number): string | null {
  if (quantosMinistros < 2 || !item.ministradoPorNome) return null

  return `puxa: ${item.ministradoPorNome}`
}

export function ministrosDaEscala(pessoas: PessoaDaEquipe[]): PessoaDaEquipe[] {
  return pessoas.filter((pessoa) => pessoa.ministro)
}

export function padraoDeQuemPuxa(escala: EscalaApresentada): string | null {
  const ministros = ministrosDaEscala(escala.pessoas).map((pessoa) => pessoa.membroId)

  for (const item of [...escala.itens].reverse()) {
    if (item.ministradoPor && ministros.includes(item.ministradoPor)) return item.ministradoPor
  }

  return ministros[0] ?? null
}

function contar(quantos: number, singular: string, plural: string): string {
  return `${quantos} ${quantos === 1 ? singular : plural}`
}
