import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { BlocoDeMinutagem } from '../componentes/BlocoDeMinutagem'
import { BlocoDeTom } from '../componentes/BlocoDeTom'
import { Botao } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Capa } from '../componentes/Capa'
import { Catalogo } from '../componentes/Catalogo'
import { Esqueleto } from '../componentes/Esqueleto'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Segmento } from '../componentes/Segmento'
import { buscaNoCifraClub } from '../dominio'
import type { Escolha, Rascunho } from '../escalas/rascunho'
import {
  corpoDaPromocao,
  corpoDoItem,
  escolhaDaMusica,
  escolhaDaSugestao,
  rascunhoDe,
  rascunhoPronto,
  textoDaCobertura,
} from '../escalas/rascunho'
import { usarEu } from '../sessao/sessao'

export function Adicionar() {
  const { id = '' } = useParams()
  const [parametros] = useSearchParams()
  const eu = usarEu()
  const navegar = useNavigate()
  const [escolha, escolher] = useState<Escolha | null>(null)

  const sugestaoId = parametros.get('sugestao')
  const musicaId = parametros.get('musica')
  const sugestao = usarBusca<SugestaoApresentada>(sugestaoId ? `/api/sugestoes/${sugestaoId}` : null)
  const musica = usarBusca<MusicaDetalhada>(musicaId ? `/api/musicas/${musicaId}?escalaId=${id}` : null)

  if (!eu.ministro && !eu.admin) return <Navigate to={`/escalas/${id}`} replace />

  if (sugestaoId) {
    if (sugestao.erro) return <p className="aviso">{sugestao.erro}</p>
    if (!sugestao.dados) return <Esqueleto forma="paragrafo" />

    return (
      <Detalhes
        escalaId={id}
        escolha={escolhaDaSugestao(sugestao.dados)}
        promoverDe={sugestao.dados.id}
        rotulo="Promover pro Repertório"
        aoVoltar={() => navegar('/sugestoes')}
      />
    )
  }

  if (musicaId) {
    if (musica.erro) return <p className="aviso">{musica.erro}</p>
    if (!musica.dados) return <Esqueleto forma="paragrafo" />

    return (
      <Formulario
        escalaId={id}
        escolha={escolhaDaMusica(musica.dados)}
        musica={musica.dados}
        promoverDe={null}
        rotulo="Adicionar ao Repertório"
        aoVoltar={() => navegar(`/musicas/${musicaId}`)}
      />
    )
  }

  if (!escolha) {
    return (
      <section className="pagina">
        <Catalogo
          modo="escolha"
          escalaId={id}
          permiteYoutube
          titulo="Adicionar música"
          sub="busque, cole um link ou escolha do catálogo"
          aoVoltar={() => navegar(`/escalas/${id}`)}
          aoEscolher={escolher}
          aoEscolherSugestao={(escolhida) => navegar(`/escalas/${id}/adicionar?sugestao=${escolhida.id}`)}
        />
      </section>
    )
  }

  return (
    <Detalhes
      escalaId={id}
      escolha={escolha}
      promoverDe={null}
      rotulo="Adicionar ao Repertório"
      aoVoltar={() => escolher(null)}
    />
  )
}

function Detalhes({
  escalaId,
  escolha,
  promoverDe,
  rotulo,
  aoVoltar,
}: {
  escalaId: string
  escolha: Escolha
  promoverDe: string | null
  rotulo: string
  aoVoltar: () => void
}) {
  const detalhe = usarBusca<MusicaDetalhada>(
    escolha.musicaId ? `/api/musicas/${escolha.musicaId}?escalaId=${escalaId}` : null,
  )

  if (detalhe.erro) return <p className="aviso">{detalhe.erro}</p>
  if (detalhe.carregando) return <Esqueleto forma="paragrafo" />

  return (
    <Formulario
      escalaId={escalaId}
      escolha={escolha}
      musica={detalhe.dados}
      promoverDe={promoverDe}
      rotulo={rotulo}
      aoVoltar={aoVoltar}
    />
  )
}

function Formulario({
  escalaId,
  escolha,
  musica,
  promoverDe,
  rotulo,
  aoVoltar,
}: {
  escalaId: string
  escolha: Escolha
  musica: MusicaDetalhada | null
  promoverDe: string | null
  rotulo: string
  aoVoltar: () => void
}) {
  const navegar = useNavigate()
  const acao = usarAcao()
  const [rascunho, escrever] = useState<Rascunho>(() => rascunhoDe(escolha, musica?.tomSugerido ?? null))

  const mudar = (mudanca: Partial<Rascunho>) => escrever((antes) => ({ ...antes, ...mudanca }))

  const confirmar = () => {
    acao.executar(async () => {
      if (promoverDe) {
        await api(`/api/sugestoes/${promoverDe}/promover`, {
          metodo: 'POST',
          corpo: corpoDaPromocao(rascunho, escalaId),
        })
      } else {
        const musicaId =
          escolha.musicaId ??
          (
            await api<MusicaDetalhada>('/api/musicas', {
              metodo: 'POST',
              corpo: { link: escolha.link, tomOriginal: rascunho.tomOriginal },
            })
          ).id

        await api(`/api/escalas/${escalaId}/itens`, { metodo: 'POST', corpo: corpoDoItem(rascunho, musicaId) })
      }

      navegar(`/escalas/${escalaId}`)
    })
  }

  const cobertura = textoDaCobertura(musica?.cobertura ?? null)

  return (
    <section className="pagina">
      <Cabecalho titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} grande />
        <p className="dica">{situacao(musica, !!promoverDe)}</p>
      </div>

      {cobertura ? (
        <p className="cobertura">{cobertura}</p>
      ) : (
        <p className="dica">Música nova: ninguém da Equipe tocou ainda.</p>
      )}

      <BlocoDeTom
        tom={rascunho.tom}
        sugerido={musica?.tomSugerido ?? null}
        historico={musica?.historico ?? []}
        tomOriginal={musica?.tomOriginal ?? rascunho.tomOriginal}
        musica={escolha.resumo}
        escolher={(tom) => mudar({ tom })}
        aoAcharOriginal={(tom) => {
          mudar({ tom, tomOriginal: tom })
          if (musica) void api(`/api/musicas/${musica.id}`, { metodo: 'PATCH', corpo: { tomOriginal: tom } })
        }}
      />

      <div className="secao">
        <h2>Como</h2>
        <Segmento
          rotulo="Como"
          opcoes={[
            { valor: 'inteira', rotulo: 'Inteira' },
            { valor: 'trecho', rotulo: 'Trecho' },
          ]}
          valor={rascunho.modo}
          aoMudar={(modo) => mudar({ modo })}
        />
      </div>

      {rascunho.modo === 'trecho' && (
        <BlocoDeMinutagem
          inicio={rascunho.inicio}
          fim={rascunho.fim}
          escrever={(campo, valor) => mudar({ [campo]: valor })}
        />
      )}

      <Campo rotulo="Observação pro grupo">
        <input
          placeholder="opcional: começar mais baixo, solo na transição…"
          value={rascunho.observacao}
          onChange={(evento) => mudar({ observacao: evento.target.value })}
        />
      </Campo>

      <a className="dica" href={musica?.cifraClub ?? buscaNoCifraClub(escolha.resumo)} target="_blank" rel="noopener">
        Conferir no Cifra Club
      </a>

      <RodapeDeAcao
        primario={
          <Botao largo disabled={acao.ocupado || !rascunhoPronto(rascunho)} onClick={confirmar}>
            {rotulo}
          </Botao>
        }
      />
    </section>
  )
}

function situacao(musica: MusicaDetalhada | null, promovendo: boolean): string {
  if (!musica) {
    return promovendo
      ? 'Ainda não está no catálogo: entra quando você promover.'
      : 'Ainda não está no catálogo: entra quando você adicionar.'
  }

  if (musica.legado) return 'Legado: veio da playlist, sem histórico no app.'
  if (musica.nova) return 'Nova: está no catálogo e ainda não foi tocada.'

  return 'Já tocada no app.'
}
