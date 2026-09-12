import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../api/cliente'
import type { MusicaDetalhada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { CamposDoItem } from '../componentes/CamposDoItem'
import { Campo } from '../componentes/Campo'
import { Capa } from '../componentes/Capa'
import { Catalogo } from '../componentes/Catalogo'
import { Esqueleto } from '../componentes/Esqueleto'
import { LinhaDeMusica } from '../componentes/LinhaDeMusica'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { Vazio } from '../componentes/Vazio'
import type { Escolha, Rascunho, TrechoEmMontagem } from '../escalas/rascunho'
import {
  corpoDoMedley,
  linksPendentes,
  medleyPronto,
  rascunhoDoTrecho,
  textoDaCobertura,
  trechoDe,
  trechoDoRascunho,
  trechoPronto,
  trechosComMusica,
} from '../escalas/rascunho'
import { usarEu } from '../sessao/sessao'

type Passo = 'montar' | 'escolher' | 'trecho'

const MAXIMO_DE_CAPAS = 4

export function Medley() {
  const { id = '' } = useParams()
  const [parametros] = useSearchParams()
  const eu = usarEu()
  const navegar = useNavigate()
  const acao = usarAcao()
  const avisar = usarAviso()
  const pendente = usarRemocaoPendente()
  const [trechos, guardarTrechos] = useState<TrechoEmMontagem[]>([])
  const [observacao, escreverObservacao] = useState('')
  const [passo, irPara] = useState<Passo>(parametros.has('escolher') ? 'escolher' : 'montar')
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

  function removerTrecho(indice: number) {
    const id = String(indice)

    pendente.agendar(id, () => guardarTrechos((atuais) => atuais.filter((_, outro) => outro !== indice)))
    avisar('Trecho tirado do Medley', { desfazer: () => pendente.desfazer(id) })
  }

  if (passo === 'escolher') {
    return (
      <section className="pagina">
        <Catalogo
          modo="escolha"
          escalaId={id}
          permiteYoutube
          titulo={`Trecho ${trechos.length + 1} do Medley`}
          sub="busque, cole um link ou escolha do catálogo"
          aoVoltar={() => irPara('montar')}
          aoEscolher={(escolhida) => {
            escolher(escolhida)
            irPara('trecho')
          }}
        />
      </section>
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
      <Cabecalho titulo="Montar Medley" sub="dois ou mais Trechos emendados" voltarPara={`/escalas/${id}`} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {trechos.length === 0 ? (
        <Vazio icone="musica">Nenhum Trecho ainda.</Vazio>
      ) : (
        <>
          <div className="cabecalho-da-musica">
            <Capa musicas={trechos.slice(0, MAXIMO_DE_CAPAS).map((trecho) => trecho.escolha.resumo)} grande />
          </div>

          <ul className="lista cartao">
            {trechos.map((trecho, indice) => {
              if (pendente.pendentes.includes(String(indice))) return null

              return (
                <LinhaDeMusica
                  key={indice}
                  musica={trecho.escolha.resumo}
                  modo="leitura"
                  numero={indice + 1}
                  tom={trecho.tom}
                  trecho={{ inicio: trecho.inicio, fim: trecho.fim }}
                  direita={
                    <Botao
                      variante="icone"
                      icone="remover"
                      aria-label={`Remover ${trecho.escolha.resumo.titulo}`}
                      onClick={() => removerTrecho(indice)}
                    />
                  }
                />
              )
            })}
          </ul>
        </>
      )}

      <Botao variante="secundario" largo onClick={() => irPara('escolher')}>
        + Trecho
      </Botao>

      <Campo rotulo="Observação pro grupo">
        <input
          placeholder="opcional: emendar direto, sem parar"
          value={observacao}
          onChange={(evento) => escreverObservacao(evento.target.value)}
        />
      </Campo>

      {trechos.length === 1 && <p className="dica">Falta pelo menos mais um Trecho.</p>}

      <RodapeDeAcao
        primario={
          <Botao largo disabled={acao.ocupado || !medleyPronto(trechos)} onClick={confirmar}>
            Adicionar Medley ao Repertório
          </Botao>
        }
      />
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
  if (detalhe.carregando) return <Esqueleto forma="paragrafo" />

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
  const [rascunho, escrever] = useState<Rascunho>(() =>
    rascunhoDoTrecho(trechoDe(escolha, musica?.tomSugerido ?? null, primeiro)),
  )

  const mudar = (mudanca: Partial<Rascunho>) => escrever((antes) => ({ ...antes, ...mudanca }))
  const trecho = trechoDoRascunho(rascunho)
  const cobertura = textoDaCobertura(musica?.cobertura ?? null)

  return (
    <section className="pagina">
      <Cabecalho titulo={escolha.resumo.titulo} sub={`Trecho ${ordem} do Medley`} aoVoltar={aoVoltar} />

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} grande />
        <p className="dica">{escolha.resumo.artista || 'Entra no catálogo quando o Medley for adicionado.'}</p>
      </div>

      {cobertura && <p className="cobertura">{cobertura}</p>}

      <CamposDoItem rascunho={rascunho} mudar={mudar} musica={musica} como={false} observacao={false} />

      <RodapeDeAcao
        primario={
          <Botao largo disabled={!trechoPronto(trecho)} onClick={() => aoConfirmar(trecho)}>
            OK, próximo
          </Botao>
        }
      />
    </section>
  )
}
