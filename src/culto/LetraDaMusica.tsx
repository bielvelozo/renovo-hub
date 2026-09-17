import { Link, Navigate, useParams } from 'react-router'
import { Vazio } from '../componentes/Vazio'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { musicaDoCatalogo } from './culto'
import { TopoDoCulto, usarCulto } from './ModoCulto'
import { TomDaMusica } from './NotaDoTom'

export function LetraDaMusica() {
  const { escala, catalogo } = usarCulto()
  const { musicaId = '' } = useParams()

  const musica = musicaDoCatalogo(catalogo, musicaId)
  if (!musica) return <Navigate to={`/culto/${escala.id}/pesquisar`} replace />

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <Link to={`/culto/${escala.id}/pesquisar`} className="volta-do-culto">
          ‹ Pesquisa
        </Link>
        <span className="cresce" />
      </TopoDoCulto>

      <div className="cabecalho-da-letra">
        <h1 className="display">{musica.titulo}</h1>
        <p className="dica">{musica.artista}</p>
        <p className="tom-grande">
          <TomDaMusica tom={musica.tom} grande />
        </p>
      </div>

      <div className="rolagem">
        {musica.letra ? <CorpoDaLetra letra={musica.letra} /> : <Vazio icone="documento">Sem letra ainda</Vazio>}
      </div>
    </>
  )
}
