import { useState } from 'react'
import { Link } from 'react-router'
import type { MusicaDoCulto } from '../api/tipos'
import { Busca } from '../componentes/Busca'
import { Cartao } from '../componentes/Cartao'
import { Vazio } from '../componentes/Vazio'
import { buscarNoCatalogo, maisTocadas } from './culto'
import { TopoDoCulto, usarCulto } from './ModoCulto'
import { TomDaMusica } from './NotaDoTom'

export function Pesquisar() {
  const { escala, catalogo } = usarCulto()
  const [termo, escrever] = useState('')

  const achadas = termo.trim() ? buscarNoCatalogo(catalogo, termo) : null
  const musicas = achadas ?? maisTocadas(catalogo)

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <Link to={`/culto/${escala.id}`} className="volta-do-culto">
          ‹ Ordem
        </Link>
        <span className="cresce" />
      </TopoDoCulto>

      <div className="busca-do-culto">
        <Busca valor={termo} aoMudar={escrever} rotulo="Pesquisar música" autoFoco />
      </div>

      <div className="rolagem">
        {!achadas && <p className="rotulo">Mais tocadas</p>}

        {musicas.length ? (
          <div className="ordem">
            {musicas.map((musica) => (
              <Cartao key={musica.id} className="item-do-culto">
                <Link to={`/culto/${escala.id}/musica/${musica.id}`} className="toque-do-culto">
                  <span className="cresce">
                    <span className="titulo">{musica.titulo}</span>
                    <span className="dica">{dicaDaMusica(musica)}</span>
                  </span>
                  <TomDaMusica tom={musica.tom} />
                </Link>
              </Cartao>
            ))}
          </div>
        ) : (
          <Vazio icone="musica">Nenhuma música com esse texto</Vazio>
        )}
      </div>
    </>
  )
}

function dicaDaMusica(musica: MusicaDoCulto): string {
  return musica.artista + (musica.letra ? ' · letra' : '')
}
