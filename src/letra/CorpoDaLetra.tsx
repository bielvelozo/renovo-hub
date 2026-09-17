import { Fragment } from 'react'
import type { Bloco, Letra } from '../dominio'

export function CorpoDaLetra({ letra }: { letra: Letra }) {
  return (
    <div className="letra">
      {letra.blocos.map((bloco, indice) => (
        <BlocoDaLetra key={indice} bloco={bloco} />
      ))}
    </div>
  )
}

function BlocoDaLetra({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === 'marcador') return <p className="marcador">{bloco.texto}</p>

  return (
    <p>
      {bloco.linhas.map((linha, indice) => (
        <Fragment key={indice}>
          {indice > 0 && <br />}
          {linha.forte ? <strong>{linha.texto}</strong> : linha.texto}
        </Fragment>
      ))}
    </p>
  )
}
