import { formatarDia } from './datas'
import { escalaPorId, gruposEquipe, musicaPorId, tituloEscala } from './escala'
import { linkDaPlaylist, linkDoVideo } from './musica'
import type { Item, Ministerio } from './tipos'

export function descricaoDoItem(m: Ministerio, item: Item): string {
  if (item.tipo === 'medley') {
    const partes = item.trechos.map(
      (t) => musicaPorId(m, t.musicaId).titulo + ' (' + t.inicio + '–' + t.fim + ', Tom ' + t.tom + ')',
    )
    return 'Medley: ' + partes.join(' + ')
  }

  const musica = musicaPorId(m, item.musicaId)
  const minutagem = item.tipo === 'trecho' ? ' (' + item.inicio + '–' + item.fim + ')' : ''
  return musica.titulo + minutagem + ' · Tom ' + item.tom
}

export function textoParaWhatsApp(m: Ministerio, escalaId: string): string {
  const escala = escalaPorId(m, escalaId)
  const linhas = ['*' + tituloEscala(escala) + ' · ' + formatarDia(escala.data) + '*']

  for (const grupo of gruposEquipe(m, escala)) linhas.push(grupo.nome + ': ' + grupo.itens.join(', '))
  if (!escala.equipe.length) linhas.push('(sem Equipe ainda)')

  linhas.push('', 'Repertório:')

  escala.itens.forEach((item, i) => {
    const numero = i + 1 + '. '
    if (item.tipo === 'medley') {
      linhas.push(numero + descricaoDoItem(m, item))
      if (item.observacao) linhas.push('   Obs: ' + item.observacao)
      for (const t of item.trechos) linhas.push('   ' + linkDoVideo(musicaPorId(m, t.musicaId), t.inicio))
      return
    }

    const musica = musicaPorId(m, item.musicaId)
    linhas.push(numero + descricaoDoItem(m, item) + ' · ' + musica.artista)
    if (item.observacao) linhas.push('   Obs: ' + item.observacao)
    linhas.push('   ' + linkDoVideo(musica, item.tipo === 'trecho' ? item.inicio : null))
  })

  if (!escala.itens.length) linhas.push('(ainda sem músicas)')

  const playlist = linkDaPlaylist(m, escala)
  if (playlist) linhas.push('', 'Playlist pra ouvir em loop: ' + playlist)

  return linhas.join('\n')
}

export function textoDeFinsDeSemana(quantidade: number): string | null {
  if (quantidade < 1) return null
  return quantidade === 1 ? '1 fim de semana seguido' : quantidade + ' fins de semana seguidos'
}
