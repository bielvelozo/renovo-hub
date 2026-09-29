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
import { containerDeRolagem, usarRolagemAutomatica } from './usarRolagemAutomatica'

export function BarraDeLeitura({ rolagem }: { rolagem?: RefObject<HTMLElement | null> }) {
  const [passo, definirPasso] = useState(lerPassoDaLetra)
  const [velocidade, definirVelocidade] = useState(lerVelocidade)
  const [rolando, definirRolando] = useState(false)
  const propria = useRef<HTMLDivElement>(null)
  const alvo = rolagem ?? propria

  useEffect(() => {
    document.documentElement.style.setProperty('--tamanho-da-letra', `${tamanhoDoPasso(passo)}px`)
  }, [passo])

  const cabe = usarCabeNaTela(alvo, passo)

  usarRolagemAutomatica(alvo, {
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

      {!cabe && (
        <Botao
          variante="secundario"
          pequeno
          icone={rolando ? 'pausar' : 'play'}
          aria-pressed={rolando}
          onClick={() => definirRolando(!rolando)}
        >
          {rolando ? 'Parar' : 'Rolar'}
        </Botao>
      )}
      {rolando && (
        <>
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
        </>
      )}
    </div>
  )
}

// Rolar só faz sentido quando sobra letra abaixo da dobra; a medida volta a cada tamanho de letra.
function usarCabeNaTela(alvo: RefObject<HTMLElement | null>, passo: number): boolean {
  const [cabe, marcarCabe] = useState(false)

  useEffect(() => {
    const caixa = containerDeRolagem(alvo.current)
    if (!caixa) return

    const medir = () => marcarCabe(caixa.scrollHeight > 0 && caixa.scrollHeight <= caixa.clientHeight)
    medir()

    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(medir)
    observador?.observe(caixa)

    return () => observador?.disconnect()
  }, [alvo, passo])

  return cabe
}
