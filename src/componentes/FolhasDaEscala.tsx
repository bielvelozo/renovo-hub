import { useState } from 'react'
import type { Playlist } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Folha } from './Folha'

export function FolhaDoWhatsapp({ escalaId, fechar }: { escalaId: string; fechar: () => void }) {
  const busca = usarBusca<{ texto: string; instrucao: string }>(`/api/escalas/${escalaId}/whatsapp`)
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
          <p className="dica">{busca.dados.instrucao}</p>
        </>
      )}
    </Folha>
  )
}

export function FolhaDaPlaylist({ escalaId, fechar }: { escalaId: string; fechar: () => void }) {
  const busca = usarBusca<Playlist>(`/api/escalas/${escalaId}/playlist`)
  const playlist = busca.dados

  return (
    <Folha titulo="Playlist pra ouvir" fechar={fechar}>
      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      {playlist && !playlist.link && (
        <p className="dica">
          A playlist sai das músicas inteiras do Repertório. Esta Escala ainda não tem nenhuma música inteira.
        </p>
      )}

      {playlist?.link && (
        <>
          <a className="botao largo" href={playlist.link} target="_blank" rel="noopener">
            Abrir no YouTube ({playlist.videoIds.length} {playlist.videoIds.length === 1 ? 'música' : 'músicas'})
          </a>
          <p className="dica">{playlist.instrucao}</p>
          {playlist.ignorados.length > 0 && (
            <p className="dica">
              {playlist.ignorados.length} {playlist.ignorados.length === 1 ? 'vídeo ficou' : 'vídeos ficaram'} de fora:
              o YouTube não achou o link.
            </p>
          )}
        </>
      )}
    </Folha>
  )
}
