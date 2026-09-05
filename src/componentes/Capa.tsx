import { useState } from 'react'
import type { MusicaResumida } from '../api/tipos'

export function Capa({ musicas, grande }: { musicas: MusicaResumida[]; grande?: boolean }) {
  const classe = 'capa' + (grande ? ' grande' : '') + (musicas.length > 1 ? ` colagem de-${musicas.length}` : '')

  return (
    <span className={classe} aria-hidden="true">
      {musicas.map((musica) => (
        <Imagem key={musica.id} musica={musica} />
      ))}
    </span>
  )
}

function Imagem({ musica }: { musica: MusicaResumida }) {
  const [origem, trocar] = useState(musica.capa)
  const [sumiu, esconder] = useState(false)

  if (sumiu) return <span className="capa-vazia" />

  return (
    <img
      src={origem}
      alt=""
      loading="lazy"
      onError={() => (origem === musica.capa ? trocar(musica.capaAlternativa) : esconder(true))}
    />
  )
}
