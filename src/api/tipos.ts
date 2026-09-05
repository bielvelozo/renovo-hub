import type { EntradaEquipe, EstadoEscala, GrupoEquipe } from '../dominio'

export type MusicaResumida = {
  id: string
  titulo: string
  artista: string
  videoId: string
  capa: string
  capaAlternativa: string
}

export type TrechoApresentado = {
  musicaId: string
  tom: string
  inicio: string
  fim: string
  musica: MusicaResumida
  link: string
}

type ItemBase = {
  id: string
  observacao: string
  ministradoPor: string | null
  descricao: string
}

export type ItemApresentado =
  | (ItemBase & { tipo: 'inteira'; musicaId: string; tom: string; musica: MusicaResumida; link: string })
  | (ItemBase & {
      tipo: 'trecho'
      musicaId: string
      tom: string
      inicio: string
      fim: string
      musica: MusicaResumida
      link: string
    })
  | (ItemBase & { tipo: 'medley'; trechos: TrechoApresentado[] })

export type EscalaApresentada = {
  id: string
  data: string
  horario: string
  rotulo: string
  santaCeia: boolean
  cancelada: boolean
  equipe: EntradaEquipe[]
  itens: ItemApresentado[]
  estado: EstadoEscala
  titulo: string
  grupos: GrupoEquipe[]
}

export type EscalaResumida = {
  id: string
  data: string
  horario: string
  rotulo: string
  santaCeia: boolean
  cancelada: boolean
  estado: EstadoEscala
  titulo: string
  ministros: string[]
  quantidadeNaEquipe: number
  quantidadeDeItens: number
}

export type Formacao = {
  id: string
  nome: string
  entradas: { membroId: string; funcoes: string[] }[]
}

export type Playlist = {
  link: string | null
  videoIds: string[]
  ignorados: string[]
  instrucao: string
}
