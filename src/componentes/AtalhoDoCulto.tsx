import { Link } from 'react-router'
import { Icone } from '../casca/Icone'

export function AtalhoDoCulto({ escalaId }: { escalaId: string }) {
  return (
    <Link to={`/culto/${escalaId}`} className="atalho-do-culto">
      <Icone nome="documento" />
      <span className="titulo cresce">Abrir o modo culto</span>
      <Icone nome="seta" />
    </Link>
  )
}
