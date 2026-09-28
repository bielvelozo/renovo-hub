import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Botao } from '../componentes/Botao'
import {
  TAMANHOS_DA_LETRA,
  VELOCIDADE_MAXIMA,
  VELOCIDADE_MINIMA,
  guardarPassoDaLetra,
  guardarVelocidade,
  lerPassoDaLetra,
  lerVelocidade,
  maisDevagar,
  maisRapido,
  passoAnterior,
  proximoPasso,
  tamanhoDoPasso,
} from './leitura'
import { usarRolagemAutomatica } from './usarRolagemAutomatica'

export function BarraDeLeitura({ rolagem }: { rolagem?: RefObject<HTMLElement | null> }) {
  const [passo, definirPasso] = useState(lerPassoDaLetra)
  const [velocidade, definirVelocidade] = useState(lerVelocidade)
  const [rolando, definirRolando] = useState(false)
  const propria = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.style.setProperty('--tamanho-da-letra', `${tamanhoDoPasso(passo)}px`)
  }, [passo])

  usarRolagemAutomatica(rolagem ?? propria, {
    ativa: rolando,
    velocidade,
    aoParar: () => definirRolando(false),
  })

  const mudarPasso = (novo: number) => {
    definirPasso(novo)
    guardarPassoDaLetra(novo)
  }

  const mudarVelocidade = (nova: number) => {
    definirVelocidade(nova)
    guardarVelocidade(nova)
  }

  return (
    <div className="barra-de-leitura" ref={propria} data-guia="barra-de-leitura">
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

      <span className="cresce" />

      <Botao
        variante="secundario"
        pequeno
        icone={rolando ? 'pausar' : 'play'}
        aria-pressed={rolando}
        onClick={() => definirRolando(!rolando)}
      >
        {rolando ? 'Parar' : 'Rolar'}
      </Botao>
      <Botao
        variante="secundario"
        pequeno
        aria-label="Mais devagar"
        disabled={velocidade === VELOCIDADE_MINIMA}
        onClick={() => mudarVelocidade(maisDevagar(velocidade))}
      >
        −
      </Botao>
      <output className="dica velocidade-da-leitura" aria-label="Velocidade da rolagem">
        {velocidade}
      </output>
      <Botao
        variante="secundario"
        pequeno
        aria-label="Mais rápido"
        disabled={velocidade === VELOCIDADE_MAXIMA}
        onClick={() => mudarVelocidade(maisRapido(velocidade))}
      >
        +
      </Botao>
    </div>
  )
}
