import type {
  AbaDaMusica,
  EntradaEquipe,
  EstadoDaSugestao,
  EstadoEscala,
  Funcao,
  GrupoEquipe,
  Letra,
  Membro,
  OrigemDoTom,
  Pendencia,
  PessoaDaEquipe,
  Planejada,
  ResumoDeGrupo,
  ResumoDoRepertorio,
  SecaoDaMusica,
  TomSugerido,
} from '../dominio'

export type MusicaResumida = {
  id: string
  titulo: string
  artista: string
  videoId: string
  capa: string
  capaAlternativa: string
}

export type MemoriaApresentada = {
  recente: boolean
  ultimaExecucao: ExecucaoApresentada | null
  planejadaEm: Planejada[]
}

export type TrechoApresentado = {
  musicaId: string
  tom: string
  inicio: string
  fim: string
  musica: MusicaResumida
  link: string
  memoria: MemoriaApresentada
}

type ItemBase = {
  id: string
  observacao: string
  ministradoPor: string | null
  ministradoPorNome: string | null
  atualizadoEm: string | null
  descricao: string
}

export type ItemApresentado =
  | (ItemBase & {
      tipo: 'inteira'
      musicaId: string
      tom: string
      musica: MusicaResumida
      link: string
      memoria: MemoriaApresentada
    })
  | (ItemBase & {
      tipo: 'trecho'
      musicaId: string
      tom: string
      inicio: string
      fim: string
      musica: MusicaResumida
      link: string
      memoria: MemoriaApresentada
    })
  | (ItemBase & { tipo: 'medley'; trechos: TrechoApresentado[]; memoria: null })

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
  pessoas: PessoaDaEquipe[]
  resumoDoRepertorio: ResumoDoRepertorio
  pendencias: Pendencia[]
  pronta: boolean
  anexosPorDono?: Record<string, Anexo[]>
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
  pendencias: Pendencia[]
  pronta: boolean
  porGrupo: ResumoDeGrupo[]
  minhasFuncoes: string[]
}

export type PosCultoApresentado = { escalaId: string; titulo: string; data: string; itens: number }

export type InicioApresentado = {
  minhaProxima: EscalaApresentada | null
  proximoCulto: EscalaApresentada | null
  pendencias: EscalaResumida[]
  posCulto: PosCultoApresentado | null
  anexosPorDono: Record<string, Anexo[]>
  semanasDeRepeticao: number
  proximoMesVazio: string | null
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
  aba: AbaDaMusica
  secao: SecaoDaMusica
  recente: boolean
  planejadaEm: Planejada[]
  vezesTocada: number
  vezesEm6Meses: number
  temLetra: boolean
}

export type TomSugeridoApresentado = TomSugerido & { ministradoPorNome: string | null }

export type Cobertura = { ja: string[]; nunca: string[] }

export type Anexo = {
  id: string
  musicaId: string | null
  itemId: string | null
  nome: string
  mime: string
  tamanho: number
  temLetra: boolean
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
  coberturaDoMinisterio: Cobertura
  anexos: Anexo[]
  letra: Letra | null
}

export type AchadoNoCifraClub = {
  titulo: string
  artista: string
  url: string
}

export type AchadoNoYoutube = {
  videoId: string
  titulo: string
  canal: string
  capa: string
  capaAlternativa: string
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

export type EscalaDaSugestao = { id: string; data: string; titulo: string }

export type SugestaoApresentada = {
  id: string
  membro: MembroResumido
  musica: MusicaNaLista | null
  link: string | null
  titulo: string
  observacao: string
  data: string
  promovidaEm: string | null
  estado: EstadoDaSugestao
  motivo: string
  decididaEm: string | null
  decididaPor: MembroResumido | null
  escala: EscalaDaSugestao | null
  apoios: MembroResumido[]
  apoiei: boolean
}

export type SugestaoRepetida = { erro: string; sugestaoId: string }

export type Configuracoes = { listaEsqueci: boolean; semanasDeRepeticao: number }

export type TomDoCulto = {
  valor: string
  origem: OrigemDoTom
  data?: string
  ministradoPorNome?: string | null
}

export type MusicaDoCulto = {
  id: string
  titulo: string
  artista: string
  tom: TomDoCulto | null
  vezesTocada: number
  letra: Letra | null
}

export type TrechoDoCulto = {
  musicaId: string
  titulo: string
  artista: string
  tom: string
  inicio: string
  fim: string
}

export type ItemDoCulto =
  | {
      id: string
      tipo: 'inteira' | 'trecho'
      musicaId: string
      titulo: string
      artista: string
      tom: string
      inicio: string | null
      fim: string | null
      observacao: string
    }
  | { id: string; tipo: 'medley'; trechos: TrechoDoCulto[]; observacao: string; letra: Letra | null }

export type EscalaDoCulto = {
  id: string
  data: string
  horario: string
  titulo: string
  itens: ItemDoCulto[]
}

export type Pacote = { geradoEm: string; escalas: EscalaDoCulto[]; catalogo: MusicaDoCulto[] }

export type MembroDetalhado = {
  id: string
  nome: string
  funcoes: Funcao[]
  ministro: boolean
  admin: boolean
  inativo: boolean
  foto: string | null
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

export type ProximaEscalaDoPerfil = { id: string; data: string; titulo: string; funcoes: string[] }

export type PerfilApresentado = {
  membro: MembroDetalhado
  escalasNoAno: number
  ultimaEscala: EscalaResumida | null
  proximaEscala: ProximaEscalaDoPerfil | null
  finsDeSemanaServidos: { servidos: number; de: number }
  finsDeSemanaSeguidos: number
  textoDeFinsDeSemana: string | null
}
