import { Cabecalho } from '../casca/Cabecalho'
import { Catalogo } from '../componentes/Catalogo'

export function Musicas() {
  return (
    <section className="pagina">
      <Cabecalho raiz titulo="Músicas" />
      <Catalogo modo="navegacao" permiteYoutube={false} />
    </section>
  )
}
