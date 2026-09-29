import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Vazio } from '../componentes/Vazio'
import { BarraDeLeitura } from '../letra/BarraDeLeitura'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { musicaDoCatalogo, ultimoTomTocado } from './culto'
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
  const ultimo = ultimoTomTocado(musica.tom)

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <Link to={`/culto/${escala.id}/pesquisar`} className="volta-do-culto">
          ‹ Pesquisa
        </Link>
        <span className="cresce" />
      </TopoDoCulto>

      <div className="cabecalho-da-letra">
        <div className="topo-da-letra">
          <div className="cresce">
            <h1 className="display">{musica.titulo}</h1>
            <p className="dica">{musica.artista}</p>
            {ultimo && <p className="dica">{ultimo}</p>}
          </div>
          {!tomDoPalco && (
            <p className="bloco-do-tom">
              {musica.tom && <span className="rotulo-do-tom">Tom</span>}
              <TomDaMusica tom={musica.tom} tamanho="grande" />
            </p>
          )}
        </div>
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
