import { useState } from 'react'
import { Link } from 'react-router'
import type { MusicaNaLista } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Capa } from '../componentes/Capa'
import { SelosDaMusica } from '../componentes/SelosDaMusica'
import { combinaBusca } from '../dominio'
import type { FiltroDoCatalogo } from '../musicas/catalogo'
import { FILTROS, caminhoDoCatalogo, textoDoVazio } from '../musicas/catalogo'

export function Musicas() {
  const [filtro, filtrar] = useState<FiltroDoCatalogo>('todas')
  const [termo, escreverTermo] = useState('')
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>(caminhoDoCatalogo(filtro))

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <h1>Músicas</h1>
      <p className="dica">Faz mais tempo primeiro; quem nunca foi tocada fica no fim.</p>

      <label className="campo">
        <span className="rotulo">Buscar</span>
        <input
          type="search"
          placeholder="parte do título ou do artista"
          value={termo}
          onChange={(evento) => escreverTermo(evento.target.value)}
        />
      </label>

      <div className="chips" role="group" aria-label="Filtros">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className="chip"
            aria-pressed={opcao.valor === filtro}
            onClick={() => filtrar(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      {catalogo.dados && achadas.length === 0 && <p className="vazio">{textoDoVazio(filtro, termo)}</p>}

      {achadas.length > 0 && (
        <ul className="lista cartao">
          {achadas.map((musica) => (
            <li key={musica.id}>
              <Link to={`/musicas/${musica.id}`} className="toque">
                <Capa musicas={[musica]} />
                <span className="cresce">
                  <span className="titulo">{musica.titulo}</span>
                  <span className="dica">{musica.artista}</span>
                  <SelosDaMusica musica={musica} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
