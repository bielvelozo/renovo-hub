import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { BlocoDeMinutagem } from '../componentes/BlocoDeMinutagem'
import { BlocoDeTom } from '../componentes/BlocoDeTom'
import { Capa } from '../componentes/Capa'
import { EscolhaDeMusica } from '../componentes/EscolhaDeMusica'
import { buscaNoCifraClub } from '../dominio'
import type { Escolha, Rascunho } from '../escalas/rascunho'
import {
  corpoDaPromocao,
  corpoDoItem,
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
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>(sugestaoId ? '/api/sugestoes?promovidas=1' : null)

  if (!eu.ministro && !eu.admin) return <Navigate to={`/escalas/${id}`} replace />

  if (sugestaoId) {
    if (sugestoes.erro) return <p className="aviso">{sugestoes.erro}</p>
    if (!sugestoes.dados) return <div className="girando" role="status" aria-label="Carregando" />

    const sugestao = sugestoes.dados.sugestoes.find((cada) => cada.id === sugestaoId)
    if (!sugestao) return <p className="aviso">Sugestão não encontrada.</p>

    return (
      <Detalhes
        escalaId={id}
        escolha={escolhaDaSugestao(sugestao)}
        promoverDe={sugestao.id}
        rotulo="Promover pro Repertório"
        aoVoltar={() => navegar('/sugestoes')}
      />
    )
  }

  if (!escolha) {
    return (
      <EscolhaDeMusica
        titulo="Adicionar música"
        sub="cole um link ou escolha do catálogo"
        aoVoltar={() => navegar(`/escalas/${id}`)}
        aoEscolher={escolher}
        aoEscolherSugestao={(sugestao) => navegar(`/escalas/${id}/adicionar?sugestao=${sugestao.id}`)}
      />
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
  if (detalhe.carregando) return <div className="girando" role="status" aria-label="Carregando" />

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
      <Barra titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

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
        <div className="segmento">
          <button
            type="button"
            aria-pressed={rascunho.modo === 'inteira'}
            onClick={() => mudar({ modo: 'inteira' })}
          >
            Inteira
          </button>
          <button type="button" aria-pressed={rascunho.modo === 'trecho'} onClick={() => mudar({ modo: 'trecho' })}>
            Trecho
          </button>
        </div>
      </div>

      {rascunho.modo === 'trecho' && (
        <BlocoDeMinutagem
          inicio={rascunho.inicio}
          fim={rascunho.fim}
          escrever={(campo, valor) => mudar({ [campo]: valor })}
        />
      )}

      <label className="campo">
        <span className="rotulo">Observação pro grupo</span>
        <input
          placeholder="opcional: começar mais baixo, solo na transição…"
          value={rascunho.observacao}
          onChange={(evento) => mudar({ observacao: evento.target.value })}
        />
      </label>

      <a className="dica" href={musica?.cifraClub ?? buscaNoCifraClub(escolha.resumo)} target="_blank" rel="noopener">
        Conferir no Cifra Club
      </a>

      <button
        type="button"
        className="botao largo"
        disabled={acao.ocupado || !rascunhoPronto(rascunho)}
        onClick={confirmar}
      >
        {rotulo}
      </button>
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
