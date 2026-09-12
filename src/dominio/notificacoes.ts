import { formatarDia, hojeEmBrasilia, horaEmBrasilia, somarDias } from './datas'
import { funcaoPorId, musicaPorId, rotuloDoHorario } from './escala'
import type { Escala, Item, Ministerio } from './tipos'

export const HORA_DO_LEMBRETE = 10

export type TipoDeNotificacao = 'escalado' | 'musica' | 'lembrete' | 'cancelada' | 'remarcada'

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
    corpo: `Você está na Escala de ${diaDaEscala(escala)}, ${rotuloDoHorario(escala.horario)}${onde}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeMudanca(escala: Escala, acao: AcaoNaMusica, descricao: string): Aviso {
  const verbo = acao === 'saiu' ? 'saiu da Escala' : `${acao} na Escala`

  return {
    titulo: TITULO_DA_MUSICA,
    corpo: `${descricao} ${verbo} de ${diaDaEscala(escala)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function avisoDeVariasMudancas(escala: Escala, quantidade: number): Aviso {
  return {
    titulo: TITULO_DA_MUSICA,
    corpo: `${quantidade} mudanças na Escala de ${diaDaEscala(escala)}`,
    url: caminhoDaEscala(escala.id),
  }
}

export function descricaoDaMudanca(m: Ministerio, item: Item): string {
  if (item.tipo === 'medley') {
    return 'Medley: ' + item.trechos.map((trecho) => musicaPorId(m, trecho.musicaId).titulo).join(' + ')
  }

  return `${musicaPorId(m, item.musicaId).titulo} (Tom ${item.tom})`
}

export function avisoDeLembrete(escala: Escala, musicas: number): Aviso {
  const hora = rotuloDoHorario(escala.horario)
  const corpo = musicas
    ? `Amanhã ${hora}: Escala com ${musicas} ${musicas === 1 ? 'música' : 'músicas'}. Toque pra ver os Tons.`
    : `Amanhã ${hora}: Escala ainda sem músicas. Toque pra ver a Equipe.`

  return { titulo: 'Amanhã tem Escala', corpo, url: caminhoDaEscala(escala.id) }
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

// Sem gênero no cadastro de Função: o «a» final acerta os grupos do ministério
// (guitarra, bateria) e o resto cai no masculino.
function comPreposicao(nome: string): string {
  return (nome.endsWith('a') ? 'na ' : 'no ') + nome
}

const TITULO_DA_MUSICA = 'Música na sua Escala'
