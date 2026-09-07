import type { EntradaEquipe, EstadoEscala, Funcao, GrupoEquipe, Membro, TomSugerido } from '../dominio'

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
  membros: string[]
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
}

export type ExecucaoApresentada = {
  escalaId: string
  data: string
  tom: string
  parcial: boolean
  ministradoPor: string | null
  ministradoPorNome: string | null
}

export type MusicaNaLista = MusicaResumida & {
  legado: boolean
  nova: boolean
  arquivada: boolean
  revisar: boolean
  tomConhecido: string | null
  tomOriginal: string | null
  ultimaExecucao: ExecucaoApresentada | null
}

export type TomSugeridoApresentado = TomSugerido & { ministradoPorNome: string | null }

export type Cobertura = { ja: string[]; nunca: string[] }

export type Anexo = {
  id: string
  musicaId: string
  nome: string
  mime: string
  tamanho: number
  versao: number
  criadoEm: string
  url: string
}

export type MusicaDetalhada = MusicaNaLista & {
  link: string
  cifraClub: string
  tomSugerido: TomSugeridoApresentado | null
  historico: ExecucaoApresentada[]
  cobertura: Cobertura | null
  anexos: Anexo[]
}

export type Resolucao = {
  videoId: string
  titulo: string
  canal: string
  capa: string
  capaAlternativa: string
  musica: MusicaDetalhada | null
}

export type MembroResumido = {
  id: string
  nome: string
}

export type SugestaoApresentada = {
  id: string
  membro: MembroResumido
  musica: MusicaResumida | null
  link: string | null
  titulo: string
  observacao: string
  data: string
  promovidaEm: string | null
  apoios: MembroResumido[]
  apoiei: boolean
}

export type MembroDetalhado = {
  id: string
  nome: string
  funcoes: Funcao[]
  ministro: boolean
  admin: boolean
  inativo: boolean
}

export type MembroComAcesso = Membro & {
  sessoes: number
  convites: number
  convitesUsados: number
  push: number
}

export type Convite = {
  token: string
  link: string
  membro: MembroResumido
}

export type PerfilApresentado = {
  membro: MembroDetalhado
  escalasNoAno: number
  ultimaEscala: EscalaResumida | null
  finsDeSemanaSeguidos: number
  textoDeFinsDeSemana: string | null
}
