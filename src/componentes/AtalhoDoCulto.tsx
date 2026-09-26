import { Link } from 'react-router'
import { Icone } from '../casca/Icone'

export function AtalhoDoCulto({ escalaId, dica }: { escalaId: string; dica: string }) {
  return (
    <Link to={`/culto/${escalaId}`} className="atalho-do-culto">
      <Icone nome="documento" />
      <span className="cresce">
        <span className="titulo">Abrir o modo culto</span>
        <span className="dica">{dica}</span>
      </span>
      <Icone nome="seta" />
    </Link>
  )
}
