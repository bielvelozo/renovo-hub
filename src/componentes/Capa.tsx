import { useState } from 'react'
import type { MusicaResumida } from '../api/tipos'
import { Icone } from '../casca/Icone'

export type TamanhoDaCapa = 'pequena' | 'grande'

export function Capa({
  musicas,
  tamanho = 'pequena',
  grande,
  tocavel,
  titulo,
  transicao,
}: {
  musicas: MusicaResumida[]
  tamanho?: TamanhoDaCapa
  grande?: boolean
  tocavel?: string
  titulo?: string
  transicao?: string
}) {
  const ehGrande = grande || tamanho === 'grande'
  const classe = 'capa' + (ehGrande ? ' grande' : '') + (musicas.length > 1 ? ` colagem de-${Math.min(musicas.length, 4)}` : '')
  const imagens = musicas.slice(0, 4).map((musica) => <Imagem key={musica.id} musica={musica} />)
  const estilo = transicao ? { viewTransitionName: transicao } : undefined

  if (tocavel) {
    const nome = titulo ?? (musicas.length === 1 ? musicas[0].titulo : null)

    return (
      <a
        className={`${classe} tocavel`}
        style={estilo}
        href={tocavel}
        target="_blank"
        rel="noopener"
        aria-label={nome ? `Tocar ${nome} no YouTube` : 'Tocar no YouTube'}
      >
        {imagens}
        <span className="play">
          <Icone nome="play" />
        </span>
      </a>
    )
  }

  return (
    <span className={classe} style={estilo} aria-hidden="true">
      {imagens}
    </span>
  )
}

function Imagem({ musica }: { musica: MusicaResumida }) {
  const [origem, trocar] = useState(musica.capa)
  const [sumiu, esconder] = useState(false)

  if (sumiu) {
    return (
      <span className="capa-vazia">
        <Icone nome="musica" />
      </span>
    )
  }

  return (
    <img
      src={origem}
      alt=""
      loading="lazy"
      onError={() => (origem === musica.capa && musica.capaAlternativa ? trocar(musica.capaAlternativa) : esconder(true))}
    />
  )
}
