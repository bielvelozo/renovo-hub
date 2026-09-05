import { Link } from 'react-router'
import type { ReactNode } from 'react'

export function Barra({
  titulo,
  sub,
  voltarPara,
  aoVoltar,
  acao,
}: {
  titulo: string
  sub?: ReactNode
  voltarPara?: string
  aoVoltar?: () => void
  acao?: ReactNode
}) {
  return (
    <div className="barra">
      {voltarPara ? (
        <Link to={voltarPara} className="botao secundario icone" aria-label="Voltar">
          ‹
        </Link>
      ) : (
        <button type="button" className="botao secundario icone" aria-label="Voltar" onClick={aoVoltar}>
          ‹
        </button>
      )}
      <div className="cresce">
        <h1>{titulo}</h1>
        {sub && <div className="dica">{sub}</div>}
      </div>
      {acao}
    </div>
  )
}
