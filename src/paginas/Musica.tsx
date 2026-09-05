import { useParams } from 'react-router'
import type { MusicaDetalhada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { Capa } from '../componentes/Capa'
import { formatarDia } from '../dominio'
import { textoDoUltimoTom } from '../musicas/catalogo'

export function Musica() {
  const { id = '' } = useParams()
  const busca = usarBusca<MusicaDetalhada>(`/api/musicas/${id}`)
  const musica = busca.dados

  if (busca.erro) return <p className="aviso">{busca.erro}</p>
  if (!musica) return <div className="girando" role="status" aria-label="Carregando" />

  return (
    <section className="pagina">
      <Barra titulo={musica.titulo} sub={musica.artista} voltarPara="/musicas" />

      <div className="cabecalho-da-musica">
        <Capa musicas={[musica]} grande />
        <p className="dica">{situacao(musica)}</p>
      </div>

      <p className="cobertura">{textoDoUltimoTom(musica.tomSugerido)}</p>

      <div className="secao">
        <h2>Histórico</h2>

        {musica.historico.length ? (
          <div className="cartao">
            {musica.historico.map((execucao) => (
              <div key={execucao.escalaId + execucao.data} className="linha-de-execucao">
                <span>
                  Tom {execucao.tom}
                  {execucao.parcial && <span className="selo parcial">trecho</span>}
                </span>
                <span className="dica">
                  {formatarDia(execucao.data)}
                  {execucao.ministradoPorNome ? ` · ${execucao.ministradoPorNome}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dica">Nenhuma Execução ainda.</p>
        )}
      </div>

      <div className="secao">
        <h2>Sequência</h2>

        {musica.anexos.length ? (
          <ul className="lista cartao">
            {musica.anexos.map((anexo) => (
              <li key={anexo.id}>
                <a className="toque" href={anexo.url}>
                  <span className="cresce">
                    <span className="titulo">{anexo.nome}</span>
                    <span className="dica">versão {anexo.versao}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dica">Nenhuma Sequência anexada.</p>
        )}
      </div>

      <div className="secao pagina">
        <a className="botao secundario largo" href={musica.link} target="_blank" rel="noopener">
          Abrir no YouTube
        </a>
        <a className="botao secundario largo" href={musica.cifraClub} target="_blank" rel="noopener">
          Conferir no Cifra Club
        </a>
      </div>
    </section>
  )
}

function situacao(musica: MusicaDetalhada): string {
  if (musica.arquivada) return 'Arquivada: fica no histórico, fora de adicionar Item.'
  if (musica.legado) return 'Legado: veio da playlist, sem histórico no app.'
  if (musica.nova) return 'Nova: está no catálogo e ainda não foi tocada.'

  return 'Já tocada no app.'
}
