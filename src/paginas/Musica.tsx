import { useParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { BuscaNoCifraClub } from '../componentes/BlocoDeTom'
import { Capa } from '../componentes/Capa'
import { Esqueleto } from '../componentes/Esqueleto'
import { SeletorDeTom } from '../componentes/SeletorDeTom'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { formatarDia, limparTitulo } from '../dominio'
import type { TituloLimpo } from '../dominio'
import { textoDoUltimoTom } from '../musicas/catalogo'
import { usarEu } from '../sessao/sessao'

export function Musica() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const busca = usarBusca<MusicaDetalhada>(`/api/musicas/${id}`)
  const musica = busca.dados
  const dirige = eu.ministro || eu.admin
  const nome = musica ? nomeExibido(musica) : null

  const cabecalho = <Cabecalho titulo={nome?.titulo ?? 'Música'} sub={nome?.artista} voltarPara="/musicas" />

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{busca.erro}</p>
      </section>
    )
  }

  if (!musica) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="paragrafo" />
      </section>
    )
  }

  return (
    <section className="pagina">
      {cabecalho}

      <div className="cabecalho-da-musica">
        <Capa musicas={[musica]} tamanho="grande" tocavel={musica.link} transicao={`capa-${musica.id}`} />
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
                  {execucao.parcial && <Selo variante="trecho">trecho</Selo>}
                </span>
                <span className="dica">
                  {formatarDia(execucao.data)}
                  {execucao.ministradoPorNome ? ` · ${execucao.ministradoPorNome}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Vazio icone="musica">Nenhuma Execução ainda.</Vazio>
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
          <Vazio icone="documento">Nenhuma Sequência anexada.</Vazio>
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

function nomeExibido(musica: MusicaDetalhada): TituloLimpo {
  if (musica.revisar) return limparTitulo(musica.titulo, musica.artista)
  return { titulo: musica.titulo, artista: musica.artista }
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
        original={musica.tomOriginal}
        desligado={acao.ocupado}
        escolher={(tom) => definir(musica.tomOriginal === tom ? null : tom)}
      />

      <BuscaNoCifraClub musica={musica} aoUsar={definir} />
    </div>
  )
}
