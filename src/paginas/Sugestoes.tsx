import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { api, ErroDaApi, textoDoErro } from '../api/cliente'
import type { MusicaDetalhada, SugestaoApresentada, SugestaoRepetida } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { BotaoDeApoio } from '../componentes/BotaoDeApoio'
import { Campo } from '../componentes/Campo'
import { Capa } from '../componentes/Capa'
import { Catalogo } from '../componentes/Catalogo'
import { Esqueleto } from '../componentes/Esqueleto'
import { FaixaDeAlerta, frasesDeAlerta } from '../componentes/FaixaDeAlerta'
import { Folha } from '../componentes/Folha'
import { FolhaDeEscolhaDeEscala } from '../componentes/FolhaDeEscolhaDeEscala'
import { LinhaDeMusica } from '../componentes/LinhaDeMusica'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Segmento } from '../componentes/Segmento'
import { Selo } from '../componentes/Selo'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { Vazio } from '../componentes/Vazio'
import { hojeEmBrasilia, limparTitulo } from '../dominio'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaMusica, escolhaDaSugestao } from '../escalas/rascunho'
import {
  CHAVE_DE_VISITA_DAS_SUGESTOES,
  corpoDaSugestao,
  podeApagar,
  textoDeAceita,
  textoDeGuardada,
  textoDeQuemSugeriu,
  textoDeRecusada,
} from '../escalas/sugestoes'
import { usarEu } from '../sessao/sessao'

type Aba = 'abertas' | 'guardadas' | 'aceitas'

function linkDaSugestao(sugestao: SugestaoApresentada): string {
  if (sugestao.musica) return `https://youtu.be/${sugestao.musica.videoId}`
  return sugestao.link ?? ''
}

function tituloDaSugestao(sugestao: SugestaoApresentada): string {
  const musica = sugestao.musica
  if (!musica) return escolhaDaSugestao(sugestao).resumo.titulo
  return musica.revisar ? limparTitulo(musica.titulo, musica.artista).titulo : musica.titulo
}

export function Sugestoes() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const avisar = usarAviso()
  const acao = usarAcao()
  const acaoApoio = usarAcao()
  const pendente = usarRemocaoPendente()

  const sugerirParam = parametros.get('sugerir')
  const abaParam = parametros.get('aba')
  const abaValida = abaParam === 'guardadas' || abaParam === 'aceitas' ? abaParam : 'abertas'

  const busca = usarBusca<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes')
  const musicaDoLink = usarBusca<MusicaDetalhada>(
    sugerirParam && sugerirParam !== '1' ? `/api/musicas/${sugerirParam}` : null,
  )

  const [aba, mudarAba] = useState<Aba>(abaValida)
  const [recusadasAbertas, abrirRecusadas] = useState(false)
  const [sugerindo, sugerir] = useState<Escolha | 'escolhendo' | null>(sugerirParam === '1' ? 'escolhendo' : null)
  const [folhaDe, abrirFolhaDe] = useState<SugestaoApresentada | null>(null)
  const [promovendo, definirPromovendo] = useState<SugestaoApresentada | null>(null)
  const [recusando, definirRecusando] = useState<SugestaoApresentada | null>(null)

  useEffect(() => {
    localStorage.setItem(CHAVE_DE_VISITA_DAS_SUGESTOES, new Date().toISOString())
  }, [])

  const trocar = (sugestao: SugestaoApresentada) => {
    busca.definir({
      sugestoes: (busca.dados?.sugestoes ?? []).map((cada) => (cada.id === sugestao.id ? sugestao : cada)),
    })
  }

  if (sugerirParam && sugerirParam !== '1') {
    const cabecalhoDoLink = <Cabecalho titulo="Sugerir uma música" aoVoltar={() => navegar('/sugestoes')} />

    if (musicaDoLink.erro) {
      return (
        <section className="pagina">
          {cabecalhoDoLink}
          <p className="aviso">{musicaDoLink.erro}</p>
        </section>
      )
    }
    if (!musicaDoLink.dados) {
      return (
        <section className="pagina">
          {cabecalhoDoLink}
          <Esqueleto forma="paragrafo" />
        </section>
      )
    }

    return (
      <Envio
        escolha={escolhaDaMusica(musicaDoLink.dados)}
        aoVoltar={() => navegar('/sugestoes')}
        aoEnviar={() => navegar('/sugestoes')}
      />
    )
  }

  if (sugerindo === 'escolhendo') {
    return (
      <section className="pagina">
        <Catalogo
          modo="escolha"
          permiteYoutube
          titulo="Sugerir uma música"
          sub="busque, cole um link ou escolha do catálogo"
          aoVoltar={() => sugerir(null)}
          aoEscolher={(escolha) => sugerir(escolha)}
        />
      </section>
    )
  }

  if (sugerindo) {
    return (
      <Envio
        escolha={sugerindo}
        aoVoltar={() => sugerir('escolhendo')}
        aoEnviar={() => {
          sugerir(null)
          busca.recarregar()
        }}
      />
    )
  }

  const cabecalho = (
    <Cabecalho
      raiz
      titulo="Sugestões"
      acao={
        <Botao variante="terciario" pequeno onClick={() => sugerir('escolhendo')}>
          + Sugerir
        </Botao>
      }
    />
  )

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{busca.erro}</p>
      </section>
    )
  }

  if (!busca.dados) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="linha-de-musica" quantidade={4} />
      </section>
    )
  }

  const todas = busca.dados.sugestoes
  const abertas = todas.filter((sugestao) => sugestao.estado === 'aberta')
  const guardadas = todas.filter((sugestao) => sugestao.estado === 'guardada')
  const aceitas = todas.filter((sugestao) => sugestao.estado === 'aceita')
  const recusadas = todas.filter((sugestao) => sugestao.estado === 'recusada')

  const apoiar = (sugestao: SugestaoApresentada) => {
    const desapoiando = sugestao.apoiei
    const otimista: SugestaoApresentada = desapoiando
      ? { ...sugestao, apoiei: false, apoios: sugestao.apoios.filter((apoio) => apoio.id !== eu.id) }
      : { ...sugestao, apoiei: true, apoios: [...sugestao.apoios, { id: eu.id, nome: eu.nome }] }
    trocar(otimista)

    acaoApoio.executar(async () => {
      try {
        trocar(
          await api<SugestaoApresentada>(`/api/sugestoes/${sugestao.id}/apoiar`, {
            metodo: desapoiando ? 'DELETE' : 'POST',
          }),
        )
      } catch (problema) {
        trocar(sugestao)
        avisar(textoDoErro(problema))
      }
    })
  }

  const guardar = (sugestao: SugestaoApresentada) => {
    abrirFolhaDe(null)
    acao.executar(async () => {
      trocar(await api<SugestaoApresentada>(`/api/sugestoes/${sugestao.id}/guardar`, { metodo: 'POST' }))
    })
  }

  const reabrir = (sugestao: SugestaoApresentada) => {
    abrirFolhaDe(null)
    acao.executar(async () => {
      trocar(await api<SugestaoApresentada>(`/api/sugestoes/${sugestao.id}/reabrir`, { metodo: 'POST' }))
    })
  }

  const apagar = (sugestao: SugestaoApresentada) => {
    abrirFolhaDe(null)
    pendente.agendar(sugestao.id, () =>
      acao.executar(async () => {
        await api(`/api/sugestoes/${sugestao.id}`, { metodo: 'DELETE' })
        busca.recarregar()
      }),
    )
    avisar('Sugestão apagada', { desfazer: () => pendente.desfazer(sugestao.id) })
  }

  const abrirMusica = (sugestao: SugestaoApresentada) => {
    if (sugestao.musica) navegar(`/musicas/${sugestao.musica.id}`)
    else if (sugestao.link) window.open(sugestao.link, '_blank', 'noopener')
  }

  const tocarNaLinha = (sugestao: SugestaoApresentada) => {
    if (dirige || (podeApagar(sugestao, eu) && sugestao.estado === 'aberta')) {
      abrirFolhaDe(sugestao)
      return
    }
    abrirMusica(sugestao)
  }

  const promover = (sugestao: SugestaoApresentada) => {
    abrirFolhaDe(null)
    definirPromovendo(sugestao)
  }

  const recusar = (sugestao: SugestaoApresentada) => {
    abrirFolhaDe(null)
    definirRecusando(sugestao)
  }

  const linha = (sugestao: SugestaoApresentada) => {
    if (pendente.pendentes.includes(sugestao.id)) return null

    return (
      <LinhaDeMusica
        key={sugestao.id}
        musica={sugestao.musica ?? escolhaDaSugestao(sugestao).resumo}
        modo="escolha"
        tempo="direita"
        aoEscolher={() => tocarNaLinha(sugestao)}
        observacao={sugestao.observacao || undefined}
        selos={
          <>
            <Selo>{textoDeQuemSugeriu(sugestao)}</Selo>
            {aba === 'guardadas' && <Selo>{textoDeGuardada(sugestao.decididaEm ?? sugestao.data)}</Selo>}
            {aba === 'aceitas' && <Selo variante="sucesso">{textoDeAceita(sugestao)}</Selo>}
          </>
        }
        direita={
          aba === 'abertas' ? (
            <BotaoDeApoio
              apoios={sugestao.apoios.length}
              apoiei={sugestao.apoiei}
              desligado={acaoApoio.ocupado}
              aoTocar={() => apoiar(sugestao)}
            />
          ) : undefined
        }
      />
    )
  }

  const linhaDeRecusada = (sugestao: SugestaoApresentada) => (
    <LinhaDeMusica
      key={sugestao.id}
      musica={sugestao.musica ?? escolhaDaSugestao(sugestao).resumo}
      modo="escolha"
      tempo="direita"
      aoEscolher={() => tocarNaLinha(sugestao)}
      observacao={sugestao.observacao || undefined}
      selos={
        <>
          <Selo>{textoDeQuemSugeriu(sugestao)}</Selo>
          <Selo variante="perigo">{textoDeRecusada(sugestao.motivo)}</Selo>
        </>
      }
    />
  )

  const listaDaAba =
    aba === 'abertas' ? abertas : aba === 'guardadas' ? guardadas : aceitas

  const vazioDaAba: Record<Aba, string> = {
    abertas: 'Nenhuma sugestão aberta. Toque em Sugerir para pedir uma música.',
    guardadas: 'Nada guardado pra depois.',
    aceitas: 'Nenhuma sugestão aceita ainda.',
  }

  return (
    <section className="pagina">
      {cabecalho}

      <Segmento
        rotulo="Sugestões"
        opcoes={[
          {
            valor: 'abertas',
            rotulo: (
              <>
                <span>Abertas</span>
                <span className="conta">{abertas.length}</span>
              </>
            ),
          },
          {
            valor: 'guardadas',
            rotulo: (
              <>
                <span>Guardadas</span>
                <span className="conta">{guardadas.length}</span>
              </>
            ),
          },
          {
            valor: 'aceitas',
            rotulo: (
              <>
                <span>Aceitas</span>
                <span className="conta">{aceitas.length}</span>
              </>
            ),
          },
        ]}
        valor={aba}
        aoMudar={mudarAba}
      />

      {listaDaAba.length === 0 ? (
        <Vazio icone="lampada">{vazioDaAba[aba]}</Vazio>
      ) : (
        <ul className="lista cartao">{listaDaAba.map(linha)}</ul>
      )}

      {aba === 'aceitas' && recusadas.length > 0 && (
        recusadasAbertas ? (
          <div className="secao-do-catalogo">
            <h2 className="titulo-da-secao">Recusadas</h2>
            <ul className="lista cartao">{recusadas.map(linhaDeRecusada)}</ul>
          </div>
        ) : (
          <button type="button" className="ver-todas" onClick={() => abrirRecusadas(true)}>
            Ver {recusadas.length} recusadas
            <Icone nome="seta" />
          </button>
        )
      )}

      {folhaDe && (
        <Folha titulo={tituloDaSugestao(folhaDe)} fechar={() => abrirFolhaDe(null)}>
          {acao.erro && <p className="aviso">{acao.erro}</p>}
          <ul className="lista">
            <li>
              <a className="toque" href={linkDaSugestao(folhaDe)} target="_blank" rel="noopener">
                <span className="cresce">
                  <span className="titulo">Ouvir</span>
                </span>
              </a>
            </li>
            {folhaDe.musica && (
              <li>
                <button type="button" className="toque" onClick={() => abrirMusica(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Ver a música</span>
                  </span>
                </button>
              </li>
            )}
            {dirige && (folhaDe.estado === 'aberta' || folhaDe.estado === 'guardada') && (
              <li>
                <button type="button" className="toque" onClick={() => promover(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Promover pra uma escala</span>
                  </span>
                </button>
              </li>
            )}
            {dirige && folhaDe.estado === 'aberta' && (
              <li>
                <button type="button" className="toque" disabled={acao.ocupado} onClick={() => guardar(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Guardar pra depois</span>
                  </span>
                </button>
              </li>
            )}
            {dirige && folhaDe.estado === 'guardada' && (
              <li>
                <button type="button" className="toque" disabled={acao.ocupado} onClick={() => reabrir(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Reabrir</span>
                  </span>
                </button>
              </li>
            )}
            {dirige && (folhaDe.estado === 'aberta' || folhaDe.estado === 'guardada') && (
              <li>
                <button type="button" className="toque perigo" onClick={() => recusar(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Recusar</span>
                  </span>
                </button>
              </li>
            )}
            {podeApagar(folhaDe, eu) && folhaDe.estado === 'aberta' && (
              <li>
                <button type="button" className="toque perigo" onClick={() => apagar(folhaDe)}>
                  <span className="cresce">
                    <span className="titulo">Apagar</span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </Folha>
      )}

      {recusando && (
        <FolhaDeRecusa
          sugestao={recusando}
          fechar={() => definirRecusando(null)}
          aoRecusar={(nova) => {
            trocar(nova)
            definirRecusando(null)
          }}
        />
      )}

      <FolhaDeEscolhaDeEscala
        aberta={!!promovendo}
        fechar={() => definirPromovendo(null)}
        jaEsta={promovendo?.musica?.planejadaEm.map((planejada) => planejada.escalaId) ?? []}
        aoEscolher={(escalaId) => navegar(`/escalas/${escalaId}/adicionar?sugestao=${promovendo?.id}`)}
      />
    </section>
  )
}

function FolhaDeRecusa({
  sugestao,
  fechar,
  aoRecusar,
}: {
  sugestao: SugestaoApresentada
  fechar: () => void
  aoRecusar: (nova: SugestaoApresentada) => void
}) {
  const acao = usarAcao()
  const [motivo, escrever] = useState('')

  const confirmar = () =>
    acao.executar(async () => {
      aoRecusar(
        await api<SugestaoApresentada>(`/api/sugestoes/${sugestao.id}/recusar`, {
          metodo: 'POST',
          corpo: { motivo: motivo.trim() },
        }),
      )
    })

  return (
    <Folha titulo="Recusar sugestão" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Campo rotulo="Motivo (opcional)">
        <input maxLength={80} placeholder="até 80 caracteres" value={motivo} onChange={(evento) => escrever(evento.target.value)} />
      </Campo>

      <Botao largo variante="perigo" disabled={acao.ocupado} onClick={confirmar}>
        Recusar
      </Botao>
    </Folha>
  )
}

function Envio({
  escolha,
  aoVoltar,
  aoEnviar,
}: {
  escolha: Escolha
  aoVoltar: () => void
  aoEnviar: () => void
}) {
  const acao = usarAcao()
  const [observacao, escrever] = useState('')
  const [duplicata, definirDuplicata] = useState<SugestaoRepetida | null>(null)
  const musica = usarBusca<MusicaDetalhada>(escolha.musicaId ? `/api/musicas/${escolha.musicaId}` : null)
  const hoje = hojeEmBrasilia()

  const enviar = () => {
    definirDuplicata(null)
    acao.executar(async () => {
      try {
        await api('/api/sugestoes', { metodo: 'POST', corpo: corpoDaSugestao(escolha, observacao) })
        aoEnviar()
      } catch (problema) {
        if (problema instanceof ErroDaApi && problema.status === 409 && ehSugestaoRepetida(problema.corpo)) {
          definirDuplicata(problema.corpo)
          return
        }
        throw problema
      }
    })
  }

  const apoiarDuplicata = () => {
    if (!duplicata) return
    acao.executar(async () => {
      await api(`/api/sugestoes/${duplicata.sugestaoId}/apoiar`, { metodo: 'POST' })
      aoEnviar()
    })
  }

  return (
    <section className="pagina">
      <Cabecalho titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} tamanho="grande" />
      </div>

      {musica.dados && <FaixaDeAlerta frases={frasesDeAlerta(musica.dados, hoje)} />}

      <Campo rotulo="Por que essa música?">
        <input
          placeholder="opcional: cabe no fim, combina com a Santa Ceia…"
          value={observacao}
          onChange={(evento) => escrever(evento.target.value)}
        />
      </Campo>

      <RodapeDeAcao
        primario={
          duplicata ? (
            <Botao largo disabled={acao.ocupado} onClick={apoiarDuplicata}>
              {duplicata.erro} · Apoiar
            </Botao>
          ) : (
            <Botao largo disabled={acao.ocupado} onClick={enviar}>
              Enviar sugestão
            </Botao>
          )
        }
      />
    </section>
  )
}

function ehSugestaoRepetida(corpo: unknown): corpo is SugestaoRepetida {
  return (
    typeof corpo === 'object' &&
    corpo !== null &&
    typeof (corpo as { sugestaoId?: unknown }).sugestaoId === 'string' &&
    typeof (corpo as { erro?: unknown }).erro === 'string'
  )
}
