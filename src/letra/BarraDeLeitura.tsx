import { useEffect, useState } from 'react'
import { Botao } from '../componentes/Botao'
import {
  TAMANHOS_DA_LETRA,
  guardarPassoDaLetra,
  lerPassoDaLetra,
  passoAnterior,
  proximoPasso,
  tamanhoDoPasso,
} from './leitura'

export function BarraDeLeitura() {
  const [passo, definirPasso] = useState(lerPassoDaLetra)

  useEffect(() => {
    document.documentElement.style.setProperty('--tamanho-da-letra', `${tamanhoDoPasso(passo)}px`)
  }, [passo])

  const mudarPasso = (novo: number) => {
    definirPasso(novo)
    guardarPassoDaLetra(novo)
  }

  return (
    <div className="barra-de-leitura">
      <Botao
        variante="secundario"
        pequeno
        aria-label="Diminuir a letra"
        disabled={passo === 0}
        onClick={() => mudarPasso(passoAnterior(passo))}
      >
        A−
      </Botao>
      <Botao
        variante="secundario"
        pequeno
        aria-label="Aumentar a letra"
        disabled={passo === TAMANHOS_DA_LETRA.length - 1}
        onClick={() => mudarPasso(proximoPasso(passo))}
      >
        A+
      </Botao>
    </div>
  )
}
