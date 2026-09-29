import { Hono } from 'hono'
import {
  TOM_ORIGINAL,
  hojeEmBrasilia,
  limparTitulo,
  musicaPorId,
  musicasDoItem,
  somarDias,
  tituloEscala,
  ultimoTom,
  vezesTocada,
} from '../../src/dominio'
import type { Escala, Item, Letra, Ministerio, Musica } from '../../src/dominio'
import type { EscalaDoCulto, ItemDoCulto, MusicaDoCulto, TomDoCulto } from '../../src/api/tipos'
import { exigirMembro } from '../autenticacao'
import { letrasMaisNovas } from '../dados/anexos'
import { carregarMinisterio } from '../dados/ministerio'
import { nomeDe } from '../http/musica'
import type { Contexto } from '../tipos'

const DIAS_DO_PACOTE = 30

export const culto = new Hono<Contexto>()

culto.get('/api/culto/pacote', exigirMembro, async (c) => {
  const [m, letras] = await Promise.all([carregarMinisterio(c.env.DB), letrasMaisNovas(c.env.DB)])

  const hoje = hojeEmBrasilia()
  const ate = somarDias(hoje, DIAS_DO_PACOTE)
  const escalas = m.escalas
    .filter((escala) => !escala.cancelada && escala.data >= hoje && escala.data <= ate)
    .sort((a, b) => a.data.localeCompare(b.data))

  const emEscala = new Set(escalas.flatMap((escala) => escala.itens.flatMap(musicasDoItem)))

  return c.json({
    geradoEm: new Date().toISOString(),
    escalas: escalas.map((escala) => noCulto(m, escala, letras.porItem)),
    catalogo: m.musicas
      .filter((musica) => !musica.arquivada || emEscala.has(musica.id))
      .map((musica) => musicaDoCulto(m, musica, letras.porMusica)),
  })
})

function noCulto(m: Ministerio, escala: Escala, porItem: Record<string, Letra>): EscalaDoCulto {
  return {
    id: escala.id,
    data: escala.data,
    horario: escala.horario,
    titulo: tituloEscala(escala),
    itens: escala.itens.map((item) => itemDoCulto(m, item, porItem)),
  }
}

function itemDoCulto(m: Ministerio, item: Item, porItem: Record<string, Letra>): ItemDoCulto {
  if (item.tipo === 'medley') {
    return {
      id: item.id,
      tipo: 'medley',
      trechos: item.trechos.map((trecho) => ({
        musicaId: trecho.musicaId,
        ...nomeDaMusica(musicaPorId(m, trecho.musicaId)),
        ...tomResolvido(musicaPorId(m, trecho.musicaId), trecho.tom),
        inicio: trecho.inicio,
        fim: trecho.fim,
      })),
      observacao: item.observacao,
      letra: porItem[item.id] ?? null,
    }
  }

  return {
    id: item.id,
    tipo: item.tipo,
    musicaId: item.musicaId,
    ...nomeDaMusica(musicaPorId(m, item.musicaId)),
    ...tomResolvido(musicaPorId(m, item.musicaId), item.tom),
    inicio: item.tipo === 'trecho' ? item.inicio : null,
    fim: item.tipo === 'trecho' ? item.fim : null,
    observacao: item.observacao,
  }
}

function musicaDoCulto(m: Ministerio, musica: Musica, porMusica: Record<string, Letra>): MusicaDoCulto {
  return {
    id: musica.id,
    ...nomeDaMusica(musica),
    tom: tomDoCulto(m, musica.id),
    vezesTocada: vezesTocada(m, musica.id),
    letra: porMusica[musica.id] ?? null,
  }
}

function tomDoCulto(m: Ministerio, musicaId: string): TomDoCulto | null {
  const sugerido = ultimoTom(m, musicaId)
  if (!sugerido) return null

  if (sugerido.origem !== 'execucao') return { valor: sugerido.tom, origem: sugerido.origem }

  return {
    valor: sugerido.tom,
    origem: sugerido.origem,
    data: sugerido.data,
    ministradoPorNome: nomeDe(m, sugerido.ministradoPor ?? null),
  }
}

// No palco o Tom precisa ser lido a um metro: «original» vira a nota da gravação quando a Música a
// registra, e o Item fica marcado para o selo. Só sobra o texto quando ninguém registrou a nota.
function tomResolvido(musica: Musica, tom: string): { tom: string; original: boolean } {
  if (tom !== TOM_ORIGINAL) return { tom, original: false }
  return { tom: musica.tomOriginal ?? TOM_ORIGINAL, original: true }
}

function nomeDaMusica(musica: Musica): { titulo: string; artista: string } {
  if (musica.revisar) return limparTitulo(musica.titulo, musica.artista)
  return { titulo: musica.titulo, artista: musica.artista }
}
