import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Botao, BotaoLink } from '../componentes/Botao'
import { SeloDaMarca } from './Marca'

const ALTURA_DA_FAIXA = 56

type Comum = { titulo: string; acao?: ReactNode }

export type PropriedadesDoCabecalho =
  | (Comum & { raiz: true; semTitulo?: boolean; tituloRico?: ReactNode; navegacao?: ReactNode })
  | (Comum & { raiz?: false; sub?: ReactNode; voltarPara?: string; aoVoltar?: () => void })

export function Cabecalho(props: PropriedadesDoCabecalho) {
  if (props.raiz)
    return (
      <CabecalhoRaiz
        titulo={props.titulo}
        acao={props.acao}
        semTitulo={props.semTitulo}
        tituloRico={props.tituloRico}
        navegacao={props.navegacao}
      />
    )
  return <CabecalhoDeSubtela {...props} />
}

function CabecalhoRaiz({
  titulo,
  acao,
  semTitulo,
  tituloRico,
  navegacao,
}: Comum & { semTitulo?: boolean; tituloRico?: ReactNode; navegacao?: ReactNode }) {
  const alvo = useRef<HTMLHeadingElement>(null)
  const [encolhido, encolher] = useState(false)

  useEffect(() => {
    const elemento = alvo.current
    if (!elemento || typeof IntersectionObserver === 'undefined') return

    const observador = new IntersectionObserver(([entrada]) => encolher(!entrada.isIntersecting), {
      rootMargin: `-${ALTURA_DA_FAIXA}px 0px 0px 0px`,
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return (
    <>
      <div className={`faixa raiz${encolhido ? ' com-titulo' : ''}`}>
        <div className="faixa-interna">
          <Link to="/" className="selo-do-cabecalho" aria-label="Início">
            <SeloDaMarca pequeno />
          </Link>
          <span className="titulo-encolhido" aria-hidden="true">
            {titulo}
          </span>
          <span className="acao-do-cabecalho">{acao}</span>
        </div>
      </div>
      {!semTitulo && (
        <div className="linha-do-titulo">
          <h1 ref={alvo} className="titulo-de-tela display">
            {tituloRico ?? titulo}
          </h1>
          {navegacao && <span className="navegacao-do-titulo">{navegacao}</span>}
        </div>
      )}
    </>
  )
}

function CabecalhoDeSubtela({
  titulo,
  sub,
  acao,
  voltarPara,
  aoVoltar,
}: Comum & { sub?: ReactNode; voltarPara?: string; aoVoltar?: () => void }) {
  return (
    <div className="faixa subtela">
      <div className="faixa-interna">
        {voltarPara ? (
          <BotaoLink para={voltarPara} variante="icone" icone="voltar" aria-label="Voltar" />
        ) : (
          <Botao variante="icone" icone="voltar" aria-label="Voltar" onClick={aoVoltar} />
        )}
        <div className="cresce">
          <h1 className="titulo-da-subtela">{titulo}</h1>
          {sub && <div className="dica">{sub}</div>}
        </div>
        <span className="acao-do-cabecalho">{acao}</span>
      </div>
    </div>
  )
}
