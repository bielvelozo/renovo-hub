import { useState } from 'react'
import type { ItemApresentado, Playlist } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { linkDeVideos } from '../dominio'
import { videosDoRepertorio } from '../escalas/repertorio'
import { Folha } from './Folha'

export function FolhaDoWhatsapp({ escalaId, fechar }: { escalaId: string; fechar: () => void }) {
  const busca = usarBusca<{ texto: string }>(`/api/escalas/${escalaId}/whatsapp`)
  const [copiado, marcarCopiado] = useState(false)

  async function copiar() {
    if (!busca.dados) return

    try {
      await navigator.clipboard.writeText(busca.dados.texto)
      marcarCopiado(true)
    } catch {
      marcarCopiado(false)
    }
  }

  return (
    <Folha titulo="Texto pro WhatsApp" fechar={fechar}>
      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      {busca.dados && (
        <>
          <textarea className="texto-longo" readOnly rows={14} value={busca.dados.texto} />
          <button type="button" className="botao largo" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
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

      {!link && <p className="vazio">Esta Escala ainda não tem músicas.</p>}

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
