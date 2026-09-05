import { Link } from 'react-router'
import type { ReactNode } from 'react'

export function Barra({
  titulo,
  sub,
  voltarPara,
  acao,
}: {
  titulo: string
  sub?: ReactNode
  voltarPara: string
  acao?: ReactNode
}) {
  return (
    <div className="barra">
      <Link to={voltarPara} className="botao secundario icone" aria-label="Voltar">
        ‹
      </Link>
      <div className="cresce">
        <h1>{titulo}</h1>
        {sub && <div className="dica">{sub}</div>}
      </div>
      {acao}
    </div>
  )
}
