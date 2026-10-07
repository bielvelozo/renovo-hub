import { formatarDia, hojeEmBrasilia, horaEmBrasilia, somarDias } from './datas'
import { funcaoPorId, musicaPorId, rotuloDoHorario } from './escala'
import type { Escala, Item, Ministerio } from './tipos'

export const HORA_DO_LEMBRETE = 10

export type TipoDeNotificacao =
  | 'escalado'
  | 'musica'
  | 'lembrete'
  | 'cancelada'
  | 'remarcada'
  | 'sugestao-aceita'
  | 'sugestao-guardada'
  | 'sugestao-recusada'
  | 'pos-culto'

export const CAMINHO_DAS_SUGESTOES = '/sugestoes'

export type AcaoNaMusica = 'entrou' | 'saiu' | 'mudou'

export type Aviso = {
  titulo: string
  corpo: string
  url: string
}

export function caminhoDaEscala(escalaId: string): string {
  return '/escalas/' + escalaId
}

export function avisoDeEscalado(m: Ministerio, escala: Escala, membroId: string): Aviso {
  const entrada = escala.equipe.find((x) => x.membroId === membroId)
  const funcoes = (entrada?.funcoes ?? []).map((id) => funcaoPorId(m, id).nome.toLowerCase())
  const onde = funcoes.length ? ', ' + funcoes.map(comPreposicao).join(' e ') : ''

  return {
    titulo: 'Você foi escalado',
    corpo: `Você está na escala de ${diaDaEscala(escala)}, ${rotuloDoHorario(escala.horario)}${onde}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeMudanca(escala: Escala, acao: AcaoNaMusica, descricao: string): Aviso {
  const verbo = acao === 'saiu' ? 'saiu da escala' : `${acao} na escala`

  return {
    titulo: TITULO_DA_MUSICA,
    corpo: `${descricao} ${verbo} de ${diaDaEscala(escala)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeVariasMudancas(escala: Escala, quantidade: number): Aviso {
  return {
    titulo: TITULO_DA_MUSICA,
    corpo: `${quantidade} mudanças na escala de ${diaDaEscala(escala)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function descricaoDaMudanca(m: Ministerio, item: Item): string {
  if (item.tipo === 'medley') {
    return 'Medley: ' + item.trechos.map((trecho) => musicaPorId(m, trecho.musicaId).titulo).join(' + ')
  }

  return `${musicaPorId(m, item.musicaId).titulo} (tom ${item.tom})`
}

export function avisoDeLembrete(escala: Escala, musicas: number): Aviso {
  const hora = rotuloDoHorario(escala.horario)
  const corpo = musicas
    ? `Amanhã, ${hora} · ${musicas} ${musicas === 1 ? 'música' : 'músicas'}`
    : `Amanhã, ${hora} · ainda sem músicas`

  return { titulo: 'Amanhã tem escala', corpo, url: caminhoDaEscala(escala.id) }
}

export function avisoDeCancelada(escala: Escala): Aviso {
  return {
    titulo: 'Escala cancelada',
    corpo: `${nomeDaEscala(escala)} de ${diaDaEscala(escala)} cancelado`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeRemarcada(escala: Escala): Aviso {
  return {
    titulo: 'Escala remarcada',
    corpo: `${nomeDaEscala(escala)} mudou para ${diaDaEscala(escala)}, ${rotuloDoHorario(escala.horario)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeSugestaoAceita(escala: Escala, tituloDaMusica: string): Aviso {
  return {
    titulo: 'Sua sugestão entrou',
    corpo: `${tituloDaMusica} no dia ${diaDaEscala(escala)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeSugestaoGuardada(tituloDaMusica: string): Aviso {
  return { titulo: 'Sua sugestão foi guardada pra depois', corpo: tituloDaMusica, url: CAMINHO_DAS_SUGESTOES }
}

export function avisoDeSugestaoRecusada(tituloDaMusica: string, motivo: string): Aviso {
  return {
    titulo: 'Sua sugestão não entrou desta vez',
    corpo: motivo ? `${tituloDaMusica} · ${motivo}` : tituloDaMusica,
    url: CAMINHO_DAS_SUGESTOES,
  }
}

export function avisoDePosCulto(escala: Escala, musicas: number): Aviso {
  return {
    titulo: `${nomeDaEscala(escala)}: ${musicas} ${musicas === 1 ? 'música' : 'músicas'} no histórico`,
    corpo: 'Se algo mudou na hora, ajuste na escala.',
    url: caminhoDaEscala(escala.id),
  }
}

export const MINUTOS_DO_POS_CULTO = 22 * 60 + 30

export function dataDoLembrete(agora: Date): string | null {
  if (horaEmBrasilia(agora) < HORA_DO_LEMBRETE) return null
  return somarDias(hojeEmBrasilia(agora), 1)
}

function diaDaEscala(escala: Escala): string {
  return formatarDia(escala.data)
}

function nomeDaEscala(escala: Escala): string {
  return escala.santaCeia ? 'Santa Ceia' : escala.rotulo
}

function comPreposicao(nome: string): string {
  return (nome.endsWith('a') ? 'na ' : 'no ') + nome
}

const TITULO_DA_MUSICA = 'Música na sua escala'
