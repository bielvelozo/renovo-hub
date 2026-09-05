import { Link } from 'react-router'

export function NaoEncontrada() {
  return (
    <section className="pagina">
      <h1>Página não encontrada</h1>
      <p className="dica">O endereço que você abriu não existe no Renovo Hub.</p>
      <Link to="/" className="botao">
        Ir pro Início
      </Link>
    </section>
  )
}
