import { Link } from 'react-router'
import { SECOES } from '../../admin/admin'
import { Cabecalho } from '../../casca/Cabecalho'
import { Icone } from '../../casca/Icone'

export function Painel() {
  return (
    <section className="pagina">
      <Cabecalho titulo="Admin" voltarPara="/perfil" />

      <ul className="lista cartao">
        {SECOES.map((secao) => (
          <li key={secao.caminho}>
            <Link to={secao.caminho} className="toque">
              <span className="cresce">
                <span className="titulo">{secao.titulo}</span>
                <span className="dica">{secao.dica}</span>
              </span>
              <Icone nome="seta" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
