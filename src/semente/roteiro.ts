import type { Escala, Funcao, Item, Membro, Musica } from '../dominio/tipos'
import { lerCsv } from './csv'
import { cru, idDoNome, inserirOuIgnorar, type Valor } from './sql'

export type MembroDeSemente = {
  id: string
  nome: string
  funcoes: string[]
  ministro: boolean
  admin: boolean
}

export type MusicaDeSemente = {
  id: string
  videoId: string
  titulo: string
  artista: string
  legado: boolean
  revisar: boolean
  tomConhecido: string | null
  tomOriginal: string | null
}

export type EntradaBase = {
  agora: string
  funcoes: Funcao[]
  membros: MembroDeSemente[]
  catalogo: MusicaDeSemente[]
  formacoes: string[]
}

export type EntradaDemonstracao = {
  agora: string
  membros: Membro[]
  musicas: Musica[]
  escalas: Escala[]
}

export function membrosDoCsv(texto: string): MembroDeSemente[] {
  return lerCsv(texto)
    .filter((linha) => linha.nome?.trim())
    .map((linha) => ({
      id: idDoNome(linha.nome),
      nome: linha.nome.trim(),
      funcoes: (linha.funcoes ?? '')
        .split(/[;,|]/)
        .map((nome) => idDoNome(nome))
        .filter(Boolean),
      ministro: verdadeiro(linha.ministro),
      admin: verdadeiro(linha.admin),
    }))
}

export function musicasDoCsv(texto: string): MusicaDeSemente[] {
  const vistos = new Set<string>()

  return lerCsv(texto)
    .filter((linha) => {
      const id = linha.videoId?.trim()
      if (!id || vistos.has(id)) return false
      vistos.add(id)
      return true
    })
    .map((linha) => ({
      id: linha.videoId.trim(),
      videoId: linha.videoId.trim(),
      titulo: linha.tituloOriginal.trim(),
      artista: (linha.canal ?? '').trim(),
      legado: true,
      revisar: true,
      tomConhecido: null,
      tomOriginal: null,
    }))
}

export function sqlBase(entrada: EntradaBase): string {
  const comandos: string[] = []

  for (const funcao of entrada.funcoes) {
    comandos.push(
      inserirOuIgnorar('funcoes', { id: funcao.id, nome: funcao.nome, naipe: funcao.naipe, ordem: funcao.ordem }),
    )
  }

  for (const membro of entrada.membros) {
    comandos.push(...linhasDoMembro(membro, entrada.agora))
  }

  for (const nome of entrada.formacoes) {
    comandos.push(inserirOuIgnorar('formacoes', { id: idDoNome(nome), nome }))
  }

  for (const musica of entrada.catalogo) {
    comandos.push(linhaDaMusica(musica, entrada.agora))
  }

  return comandos.join('\n') + '\n'
}

export function sqlDemonstracao(entrada: EntradaDemonstracao): string {
  const comandos: string[] = []
  const videoPorMusica = new Map(entrada.musicas.map((musica) => [musica.id, musica.videoId]))

  for (const membro of entrada.membros) {
    comandos.push(...linhasDoMembro(membro, entrada.agora))
  }

  for (const musica of entrada.musicas) {
    comandos.push(linhaDaMusica(musica, entrada.agora))
  }

  for (const escala of entrada.escalas) {
    comandos.push(
      inserirOuIgnorar('escalas', {
        id: escala.id,
        data: escala.data,
        horario: escala.horario,
        rotulo: escala.rotulo,
        santa_ceia: escala.santaCeia,
        cancelada: escala.cancelada,
        criado_em: entrada.agora,
      }),
    )

    for (const entradaEquipe of escala.equipe) {
      comandos.push(
        inserirOuIgnorar('equipe_membros', {
          escala_id: escala.id,
          membro_id: entradaEquipe.membroId,
          ministro: entradaEquipe.ministro,
        }),
      )
      for (const funcaoId of entradaEquipe.funcoes) {
        comandos.push(
          inserirOuIgnorar('equipe_funcoes', {
            escala_id: escala.id,
            membro_id: entradaEquipe.membroId,
            funcao_id: funcaoId,
          }),
        )
      }
    }

    escala.itens.forEach((item, ordem) => {
      comandos.push(...linhasDoItem(item, escala.id, ordem, videoPorMusica))
    })
  }

  return comandos.join('\n') + '\n'
}

function linhasDoMembro(membro: MembroDeSemente | Membro, agora: string): string[] {
  return [
    inserirOuIgnorar('membros', {
      id: membro.id,
      nome: membro.nome,
      admin: membro.admin,
      ministro: membro.ministro,
      criado_em: agora,
    }),
    ...membro.funcoes.map((funcaoId) =>
      inserirOuIgnorar('membro_funcoes', { membro_id: membro.id, funcao_id: funcaoId }),
    ),
  ]
}

function linhaDaMusica(musica: MusicaDeSemente | Musica, agora: string): string {
  return inserirOuIgnorar('musicas', {
    id: musica.id,
    titulo: musica.titulo,
    artista: musica.artista,
    video_id: musica.videoId,
    legado: musica.legado,
    tom_conhecido: musica.tomConhecido,
    tom_original: musica.tomOriginal,
    arquivada: 'arquivada' in musica ? musica.arquivada : false,
    revisar: musica.revisar,
    criado_em: agora,
  })
}

function linhasDoItem(item: Item, escalaId: string, ordem: number, videoPorMusica: Map<string, string>): string[] {
  const base = {
    id: item.id,
    escala_id: escalaId,
    ordem,
    tipo: item.tipo,
    observacao: item.observacao,
    ministrado_por: item.ministradoPor,
  }

  if (item.tipo === 'medley') {
    return [
      inserirOuIgnorar('itens', { ...base, musica_id: null, tom: null, inicio: null, fim: null }),
      ...item.trechos.map((trecho, i) =>
        inserirOuIgnorar('trechos', {
          id: `${item.id}-t${i + 1}`,
          item_id: item.id,
          ordem: i,
          musica_id: musicaPorVideo(trecho.musicaId, videoPorMusica),
          tom: trecho.tom,
          inicio: trecho.inicio,
          fim: trecho.fim,
        }),
      ),
    ]
  }

  return [
    inserirOuIgnorar('itens', {
      ...base,
      musica_id: musicaPorVideo(item.musicaId, videoPorMusica),
      tom: item.tom,
      inicio: item.tipo === 'trecho' ? item.inicio : null,
      fim: item.tipo === 'trecho' ? item.fim : null,
    }),
  ]
}

function musicaPorVideo(musicaId: string, videoPorMusica: Map<string, string>): Valor {
  const videoId = videoPorMusica.get(musicaId)
  if (!videoId) throw new Error(`Música ${musicaId} não está no catálogo da demonstração`)
  return cru(`(SELECT id FROM musicas WHERE video_id = '${videoId}')`)
}

function verdadeiro(campo: string | undefined): boolean {
  const valor = (campo ?? '').trim().toLowerCase()
  return valor === '1' || valor === 'sim' || valor === 'true'
}
