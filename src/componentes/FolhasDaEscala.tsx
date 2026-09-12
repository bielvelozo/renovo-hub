import type { ItemApresentado, Playlist } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { linkDeVideos } from '../dominio'
import { videosDoRepertorio } from '../escalas/repertorio'
import { usarAviso } from './Avisos'
import { Botao } from './Botao'
import { Esqueleto } from './Esqueleto'
import { Folha } from './Folha'
import { Vazio } from './Vazio'

export function FolhaDoWhatsapp({ escalaId, fechar }: { escalaId: string; fechar: () => void }) {
  const busca = usarBusca<{ texto: string }>(`/api/escalas/${escalaId}/whatsapp`)
  const avisar = usarAviso()

  async function copiar() {
    if (!busca.dados) return

    try {
      await navigator.clipboard.writeText(busca.dados.texto)
      avisar('Copiado')
    } catch {
      // Sem permissão de área de transferência: a pessoa copia o texto à mão.
    }
  }

  return (
    <Folha titulo="Texto pro WhatsApp" fechar={fechar}>
      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <Esqueleto forma="paragrafo" />}

      {busca.dados && (
        <>
          <textarea className="texto-longo" readOnly rows={14} value={busca.dados.texto} />
          <Botao largo onClick={copiar}>
            Copiar
          </Botao>
        </>
      )}
    </Folha>
  )
}

// O link é montado na hora com os vídeos que a tela já tem, pra a folha abrir sem
// espera. O servidor só confere se algum vídeo sumiu do YouTube e corrige depois.
export function FolhaDaPlaylist({
  escalaId,
  itens,
  fechar,
}: {
  escalaId: string
  itens: ItemApresentado[]
  fechar: () => void
}) {
  const busca = usarBusca<Playlist>(`/api/escalas/${escalaId}/playlist`)
  const conferida = busca.dados

  const videoIds = conferida?.videoIds ?? videosDoRepertorio(itens)
  const link = conferida?.link ?? linkDeVideos(videoIds)
  const ignorados = conferida?.ignorados.length ?? 0

  return (
    <Folha titulo="Playlist pra ouvir" fechar={fechar}>
      {busca.erro && <p className="aviso">{busca.erro}</p>}

      {!link && <Vazio icone="musica">Esta Escala ainda não tem músicas.</Vazio>}

      {link && (
        <>
          <a className="botao largo" href={link} target="_blank" rel="noopener">
            Abrir no YouTube ({videoIds.length} {videoIds.length === 1 ? 'música' : 'músicas'})
          </a>
          {ignorados > 0 && (
            <p className="dica">
              {ignorados} {ignorados === 1 ? 'vídeo ficou' : 'vídeos ficaram'} de fora: o YouTube não achou o link.
            </p>
          )}
        </>
      )}
    </Folha>
  )
}
