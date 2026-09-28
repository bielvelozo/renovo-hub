import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaApresentada, MusicaDetalhada, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { CamposDoItem } from '../componentes/CamposDoItem'
import { Capa } from '../componentes/Capa'
import { Catalogo } from '../componentes/Catalogo'
import { ErroDeCarga } from '../componentes/ErroDeCarga'
import { Esqueleto } from '../componentes/Esqueleto'
import { FaixaDeAlerta, frasesDeAlerta } from '../componentes/FaixaDeAlerta'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { TOM_ORIGINAL, hojeEmBrasilia } from '../dominio'
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
import { ministrosDaEscala, padraoDeQuemPuxa } from '../escalas/repertorio'
import { marcarTarefa } from '../guia/andamento'
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
    if (sugestao.erro) {
      return <Problema texto={sugestao.erro} tentarDeNovo={sugestao.recarregar} aoVoltar={() => navegar('/sugestoes')} />
    }
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
    if (musica.erro) {
      return <Problema texto={musica.erro} tentarDeNovo={musica.recarregar} aoVoltar={() => navegar(`/escalas/${id}`)} />
    }
    if (!musica.dados) return <Esqueleto forma="paragrafo" />

    return (
      <Detalhes
        escalaId={id}
        escolha={escolhaDaMusica(musica.dados)}
        musica={musica.dados}
        promoverDe={null}
        rotulo="Adicionar ao Repertório"
        aoVoltar={() => navegar(`/musicas/${musicaId}`)}
      />
    )
  }

  // O catálogo fica montado, só escondido, enquanto o formulário aparece: voltar
  // encontra a busca e a aba onde estavam.
  return (
    <>
      <section className="pagina" hidden={escolha !== null}>
        <Catalogo
          modo="escolha"
          escalaId={id}
          permiteYoutube
          titulo="Adicionar música"
          sub="busque, cole um link ou escolha do catálogo"
          aoVoltar={() => navegar(`/escalas/${id}`)}
          aoEscolher={escolher}
          aoEscolherSugestao={(escolhida) => navegar(`/escalas/${id}/adicionar?sugestao=${escolhida.id}`)}
          acima={
            <ul className="lista cartao">
              <li>
                <Link to={`/escalas/${id}/medley`} className="toque">
                  <Icone nome="musica" />
                  <span className="cresce titulo">Montar um medley</span>
                  <Icone nome="seta" />
                </Link>
              </li>
            </ul>
          }
        />
      </section>

      {escolha && (
        <Detalhes
          escalaId={id}
          escolha={escolha}
          promoverDe={null}
          rotulo="Adicionar ao Repertório"
          aoVoltar={() => escolher(null)}
        />
      )}
    </>
  )
}

function Detalhes({
  escalaId,
  escolha,
  promoverDe,
  rotulo,
  aoVoltar,
  musica: jaBuscada = null,
}: {
  escalaId: string
  escolha: Escolha
  promoverDe: string | null
  rotulo: string
  aoVoltar: () => void
  musica?: MusicaDetalhada | null
}) {
  const escala = usarBusca<EscalaApresentada>(`/api/escalas/${escalaId}`)
  const detalhe = usarBusca<MusicaDetalhada>(
    !jaBuscada && escolha.musicaId ? `/api/musicas/${escolha.musicaId}?escalaId=${escalaId}` : null,
  )

  if (detalhe.erro) return <Problema texto={detalhe.erro} tentarDeNovo={detalhe.recarregar} aoVoltar={aoVoltar} />
  if (escala.erro) return <Problema texto={escala.erro} tentarDeNovo={escala.recarregar} aoVoltar={aoVoltar} />
  if (detalhe.carregando || !escala.dados) return <Esqueleto forma="paragrafo" />

  return (
    <Formulario
      escalaId={escalaId}
      escala={escala.dados}
      escolha={escolha}
      musica={jaBuscada ?? detalhe.dados}
      promoverDe={promoverDe}
      rotulo={rotulo}
      aoVoltar={aoVoltar}
    />
  )
}

function Formulario({
  escalaId,
  escala,
  escolha,
  musica,
  promoverDe,
  rotulo,
  aoVoltar,
}: {
  escalaId: string
  escala: EscalaApresentada
  escolha: Escolha
  musica: MusicaDetalhada | null
  promoverDe: string | null
  rotulo: string
  aoVoltar: () => void
}) {
  const navegar = useNavigate()
  const acao = usarAcao()
  const avisar = usarAviso()
  const [rascunho, escrever] = useState<Rascunho>(() =>
    rascunhoDe(escolha, musica?.tomSugerido ?? null, padraoDeQuemPuxa(escala)),
  )

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

      marcarTarefa(promoverDe ? 'promover' : 'adicionar-musica')
      avisar(textoDaAdicao(escolha.resumo.titulo, rascunho.tom))
      navegar(`/escalas/${escalaId}`, { state: { itemNovo: true } })
    })
  }

  const cobertura = textoDaCobertura(musica?.cobertura ?? null)
  const frases = musica
    ? frasesDeAlerta(
        { recente: musica.recente, ultimaExecucao: musica.ultimaExecucao, planejadaEm: musica.planejadaEm },
        hojeEmBrasilia(),
      )
    : []

  return (
    <section className="pagina">
      <Cabecalho titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="capa-e-cobertura">
        <Capa musicas={[escolha.resumo]} />
        <p className="dica cresce">{cobertura ?? 'Ninguém da equipe tocou esta música ainda.'}</p>
      </div>

      <FaixaDeAlerta frases={frases} />

      <CamposDoItem rascunho={rascunho} mudar={mudar} musica={musica} ministros={ministrosDaEscala(escala.pessoas)} />

      <RodapeDeAcao
        primario={
          <Botao largo disabled={acao.ocupado || !rascunhoPronto(rascunho)} onClick={confirmar} data-guia="confirmar-item">
            {rotulo}
          </Botao>
        }
      />
    </section>
  )
}

export function textoDaAdicao(titulo: string, tom: string | null): string {
  if (!tom) return `Adicionada: ${titulo}`

  return `Adicionada: ${titulo} em ${tom === TOM_ORIGINAL ? 'tom original' : tom}`
}

function Problema({ texto, tentarDeNovo, aoVoltar }: { texto: string; tentarDeNovo: () => void; aoVoltar: () => void }) {
  return (
    <section className="pagina">
      <Cabecalho titulo="Adicionar música" aoVoltar={aoVoltar} />
      <ErroDeCarga mensagem={texto} tentarDeNovo={tentarDeNovo} />
    </section>
  )
}
