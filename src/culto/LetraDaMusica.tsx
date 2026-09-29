import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Vazio } from '../componentes/Vazio'
import { BarraDeLeitura } from '../letra/BarraDeLeitura'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { musicaDoCatalogo } from './culto'
import { TopoDoCulto, usarCulto } from './ModoCulto'
import { TomDaMusica, TomNoPalco } from './NotaDoTom'
import { usarTeclasDoPalco } from './usarTeclasDoPalco'

export function LetraDaMusica() {
  const { escala, catalogo } = usarCulto()
  const { musicaId = '' } = useParams()
  const corpo = useRef<HTMLDivElement>(null)

  usarTeclasDoPalco(corpo)

  const musica = musicaDoCatalogo(catalogo, musicaId)
  if (!musica) return <Navigate to={`/culto/${escala.id}/pesquisar`} replace />

  const tomDoPalco = musica.letra ? null : musica.tom

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
        {!tomDoPalco && (
          <p className="tom-grande">
            <TomDaMusica tom={musica.tom} tamanho="grande" />
          </p>
        )}
      </div>

      {musica.letra && <BarraDeLeitura key={musicaId} rolagem={corpo} />}

      <div className={musica.letra ? 'rolagem' : 'rolagem culto-parado'} ref={corpo}>
        {musica.letra ? (
          <CorpoDaLetra letra={musica.letra} />
        ) : (
          <>
            {tomDoPalco && <TomNoPalco tom={tomDoPalco.valor} />}
            <Vazio icone="documento">Sem letra ainda</Vazio>
          </>
        )}
      </div>
    </>
  )
}
