export type Naipe = 'vocal' | 'instrumentos' | 'tecnica'

export type EstadoEscala = 'agendada' | 'realizada' | 'cancelada'

export type TipoItem = 'inteira' | 'trecho' | 'medley'

export type Funcao = {
  id: string
  nome: string
  naipe: Naipe
  ordem: number
}

export type Membro = {
  id: string
  nome: string
  funcoes: string[]
  ministro: boolean
  admin: boolean
  inativo: boolean
}

export type Musica = {
  id: string
  titulo: string
  artista: string
  videoId: string
  legado: boolean
  tomConhecido: string | null
  tomOriginal: string | null
  arquivada: boolean
  revisar: boolean
}

export type EntradaEquipe = {
  membroId: string
  funcoes: string[]
  ministro: boolean
}

export type EntradaDaFormacao = {
  membroId: string
  funcoes: string[]
}

export type Trecho = {
  musicaId: string
  tom: string
  inicio: string
  fim: string
}

type ItemBase = {
  id: string
  observacao: string
  ministradoPor: string | null
}

export type ItemInteira = ItemBase & { tipo: 'inteira'; musicaId: string; tom: string }
export type ItemTrecho = ItemBase & { tipo: 'trecho'; musicaId: string; tom: string; inicio: string; fim: string }
export type ItemMedley = ItemBase & { tipo: 'medley'; trechos: Trecho[] }

export type Item = ItemInteira | ItemTrecho | ItemMedley

export type Escala = {
  id: string
  data: string
  horario: string
  rotulo: string
  santaCeia: boolean
  cancelada: boolean
  equipe: EntradaEquipe[]
  itens: Item[]
}

export type Ministerio = {
  hoje: string
  funcoes: Funcao[]
  membros: Membro[]
  musicas: Musica[]
  escalas: Escala[]
}

export type Execucao = {
  escalaId: string
  data: string
  musicaId: string
  tom: string
  parcial: boolean
  ministradoPor: string | null
  membros: string[]
}

export type OrigemDoTom = 'execucao' | 'conhecido' | 'original'

export type TomSugerido = {
  tom: string
  origem: OrigemDoTom
  data?: string
  ministradoPor?: string | null
  parcial?: boolean
}

export type GrupoEquipe = {
  nome: string
  itens: string[]
}
