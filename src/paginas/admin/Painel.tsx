import { Link } from 'react-router'
import { SECOES } from '../../admin/admin'

export function Painel() {
  return (
    <section className="pagina">
      <h1>Admin</h1>

      <ul className="lista cartao">
        {SECOES.map((secao) => (
          <li key={secao.caminho}>
            <Link to={secao.caminho} className="toque">
              <span className="cresce">
                <span className="titulo">{secao.titulo}</span>
                <span className="dica">{secao.dica}</span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
