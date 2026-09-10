import { useParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { Capa } from '../componentes/Capa'
import { BuscaNoCifraClub } from '../componentes/BlocoDeTom'
import { SeletorDeTom } from '../componentes/SeletorDeTom'
import { formatarDia } from '../dominio'
import { textoDoUltimoTom } from '../musicas/catalogo'
import { usarEu } from '../sessao/sessao'

export function Musica() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const busca = usarBusca<MusicaDetalhada>(`/api/musicas/${id}`)
  const musica = busca.dados
  const dirige = eu.ministro || eu.admin

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

      {dirige && <TomOriginal musica={musica} trocar={busca.definir} />}

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

function TomOriginal({ musica, trocar }: { musica: MusicaDetalhada; trocar: (nova: MusicaDetalhada) => void }) {
  const acao = usarAcao()

  const definir = (tom: string | null) => {
    acao.executar(async () => {
      const nova = await api<MusicaDetalhada>(`/api/musicas/${musica.id}`, {
        metodo: 'PATCH',
        corpo: { tomOriginal: tom },
      })
      trocar({ ...musica, ...nova })
    })
  }

  return (
    <div className="secao">
      <h2>Tom original</h2>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <SeletorDeTom
        tom={musica.tomOriginal}
        desligado={acao.ocupado}
        escolher={(tom) => definir(musica.tomOriginal === tom ? null : tom)}
      />

      <BuscaNoCifraClub musica={musica} aoUsar={definir} />
    </div>
  )
}
