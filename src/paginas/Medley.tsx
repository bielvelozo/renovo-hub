import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { BlocoDeMinutagem } from '../componentes/BlocoDeMinutagem'
import { BlocoDeTom } from '../componentes/BlocoDeTom'
import { Capa } from '../componentes/Capa'
import { EscolhaDeMusica } from '../componentes/EscolhaDeMusica'
import type { Escolha, TrechoEmMontagem } from '../escalas/rascunho'
import {
  corpoDoMedley,
  linksPendentes,
  medleyPronto,
  textoDaCobertura,
  trechoDe,
  trechoPronto,
  trechosComMusica,
} from '../escalas/rascunho'
import { usarEu } from '../sessao/sessao'

type Passo = 'montar' | 'escolher' | 'trecho'

const MAXIMO_DE_CAPAS = 4

export function Medley() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const navegar = useNavigate()
  const acao = usarAcao()
  const [trechos, guardarTrechos] = useState<TrechoEmMontagem[]>([])
  const [observacao, escreverObservacao] = useState('')
  const [passo, irPara] = useState<Passo>('montar')
  const [escolha, escolher] = useState<Escolha | null>(null)

  if (!eu.ministro && !eu.admin) return <Navigate to={`/escalas/${id}`} replace />

  const confirmar = () => {
    acao.executar(async () => {
      const idPorLink: Record<string, string> = {}

      for (const link of linksPendentes(trechos)) {
        idPorLink[link] = (await api<MusicaDetalhada>('/api/musicas', { metodo: 'POST', corpo: { link } })).id
      }

      await api(`/api/escalas/${id}/itens`, {
        metodo: 'POST',
        corpo: corpoDoMedley(trechosComMusica(trechos, idPorLink), observacao),
      })

      navegar(`/escalas/${id}`)
    })
  }

  if (passo === 'escolher') {
    return (
      <EscolhaDeMusica
        titulo={`Trecho ${trechos.length + 1} do Medley`}
        sub="cole um link ou escolha do catálogo"
        aoVoltar={() => irPara('montar')}
        aoEscolher={(escolhida) => {
          escolher(escolhida)
          irPara('trecho')
        }}
      />
    )
  }

  if (passo === 'trecho' && escolha) {
    return (
      <NovoTrecho
        escalaId={id}
        escolha={escolha}
        ordem={trechos.length + 1}
        primeiro={trechos.length === 0}
        aoVoltar={() => irPara('escolher')}
        aoConfirmar={(trecho) => {
          guardarTrechos([...trechos, trecho])
          escolher(null)
          irPara('montar')
        }}
      />
    )
  }

  return (
    <section className="pagina">
      <Barra
        titulo="Montar Medley"
        sub="dois ou mais Trechos emendados"
        voltarPara={`/escalas/${id}`}
        acao={
          <button
            type="button"
            className="botao pequeno"
            disabled={acao.ocupado || !medleyPronto(trechos)}
            onClick={confirmar}
          >
            Adicionar
          </button>
        }
      />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {trechos.length === 0 ? (
        <p className="dica">
          Nenhum Trecho ainda.
        </p>
      ) : (
        <>
          <div className="cabecalho-da-musica">
            <Capa musicas={trechos.slice(0, MAXIMO_DE_CAPAS).map((trecho) => trecho.escolha.resumo)} grande />
            </div>

          <ul className="lista cartao">
            {trechos.map((trecho, indice) => (
              <li key={indice} className="item">
                <Capa musicas={[trecho.escolha.resumo]} />
                <div className="cresce">
                  <div className="titulo">
                    {indice + 1}. {trecho.escolha.resumo.titulo}
                  </div>
                  <div className="dica">
                    {trecho.inicio}–{trecho.fim} · Tom {trecho.tom}
                  </div>
                </div>
                <div className="acoes">
                  <button
                    type="button"
                    className="botao secundario icone"
                    aria-label={`Remover ${trecho.escolha.resumo.titulo}`}
                    onClick={() => guardarTrechos(trechos.filter((_, outro) => outro !== indice))}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className="botao secundario largo" onClick={() => irPara('escolher')}>
        + Trecho
      </button>

      <label className="campo">
        <span className="rotulo">Observação pro grupo</span>
        <input
          placeholder="opcional: emendar direto, sem parar"
          value={observacao}
          onChange={(evento) => escreverObservacao(evento.target.value)}
        />
      </label>

      <button
        type="button"
        className="botao largo"
        disabled={acao.ocupado || !medleyPronto(trechos)}
        onClick={confirmar}
      >
        Adicionar Medley ao Repertório
      </button>

      {trechos.length === 1 && <p className="dica">Falta pelo menos mais um Trecho.</p>}
    </section>
  )
}

function NovoTrecho({
  escalaId,
  escolha,
  ordem,
  primeiro,
  aoVoltar,
  aoConfirmar,
}: {
  escalaId: string
  escolha: Escolha
  ordem: number
  primeiro: boolean
  aoVoltar: () => void
  aoConfirmar: (trecho: TrechoEmMontagem) => void
}) {
  const detalhe = usarBusca<MusicaDetalhada>(
    escolha.musicaId ? `/api/musicas/${escolha.musicaId}?escalaId=${escalaId}` : null,
  )

  if (detalhe.erro) return <p className="aviso">{detalhe.erro}</p>
  if (detalhe.carregando) return <div className="girando" role="status" aria-label="Carregando" />

  return (
    <Campos
      escolha={escolha}
      musica={detalhe.dados}
      ordem={ordem}
      primeiro={primeiro}
      aoVoltar={aoVoltar}
      aoConfirmar={aoConfirmar}
    />
  )
}

function Campos({
  escolha,
  musica,
  ordem,
  primeiro,
  aoVoltar,
  aoConfirmar,
}: {
  escolha: Escolha
  musica: MusicaDetalhada | null
  ordem: number
  primeiro: boolean
  aoVoltar: () => void
  aoConfirmar: (trecho: TrechoEmMontagem) => void
}) {
  const [trecho, escrever] = useState<TrechoEmMontagem>(() => trechoDe(escolha, musica?.tomSugerido ?? null, primeiro))

  const mudar = (mudanca: Partial<TrechoEmMontagem>) => escrever((antes) => ({ ...antes, ...mudanca }))
  const cobertura = textoDaCobertura(musica?.cobertura ?? null)

  return (
    <section className="pagina">
      <Barra titulo={escolha.resumo.titulo} sub={`Trecho ${ordem} do Medley`} aoVoltar={aoVoltar} />

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} grande />
        <p className="dica">{escolha.resumo.artista || 'Entra no catálogo quando o Medley for adicionado.'}</p>
      </div>

      {cobertura && <p className="cobertura">{cobertura}</p>}

      <BlocoDeTom
        tom={trecho.tom}
        sugerido={musica?.tomSugerido ?? null}
        historico={musica?.historico ?? []}
        escolher={(tom) => mudar({ tom })}
      />

      <BlocoDeMinutagem
        inicio={trecho.inicio}
        fim={trecho.fim}
        escrever={(campo, valor) => mudar({ [campo]: valor })}
      />

      <button
        type="button"
        className="botao largo"
        disabled={!trechoPronto(trecho)}
        onClick={() => aoConfirmar(trecho)}
      >
        OK, próximo
      </button>
    </section>
  )
}
