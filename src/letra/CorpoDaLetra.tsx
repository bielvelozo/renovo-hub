import type { Bloco, Letra } from '../dominio'
import { textoDoMarcador } from './letra'

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
  if (bloco.tipo === 'marcador') {
    const texto = textoDoMarcador(bloco.texto)
    return texto ? <p className="marcador">{texto}</p> : null
  }

  return (
    <p>
      {bloco.linhas.map((linha, indice) => (
        <span key={indice} className="verso">
          {linha.forte ? <strong>{linha.texto}</strong> : linha.texto}
        </span>
      ))}
    </p>
  )
}
