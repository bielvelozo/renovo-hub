import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaResumida, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { Capa } from '../componentes/Capa'
import { EscolhaDeMusica } from '../componentes/EscolhaDeMusica'
import { Folha } from '../componentes/Folha'
import { rotuloDoDia } from '../escalas/mes'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaSugestao } from '../escalas/rascunho'
import { corpoDaSugestao, diaDaSugestao, podeApagar, textoDosApoios } from '../escalas/sugestoes'
import { usarEu } from '../sessao/sessao'

export function Sugestoes() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const navegar = useNavigate()
  const busca = usarBusca<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes')
  const escalas = usarBusca<{ escalas: EscalaResumida[] }>(dirige ? '/api/escalas' : null)
  const acao = usarAcao()
  const [promovendo, escolher] = useState<SugestaoApresentada | null>(null)
  const [sugerindo, sugerir] = useState<Escolha | null | 'escolhendo'>(null)

  const trocar = (sugestao: SugestaoApresentada) => {
    busca.definir({
      sugestoes: (busca.dados?.sugestoes ?? []).map((cada) => (cada.id === sugestao.id ? sugestao : cada)),
    })
  }

  if (sugerindo === 'escolhendo') {
    return (
      <EscolhaDeMusica
        titulo="Sugerir uma música"
        sub="cole um link ou escolha do catálogo"
        aoVoltar={() => sugerir(null)}
        aoEscolher={(escolha) => sugerir(escolha)}
      />
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

  if (busca.erro) return <p className="aviso">{busca.erro}</p>
  if (!busca.dados) return <div className="girando" role="status" aria-label="Carregando" />

  const lista = busca.dados.sugestoes
  const agendadas = (escalas.dados?.escalas ?? []).filter((escala) => escala.estado === 'agendada')

  return (
    <section className="pagina">
      <h1>Sugestões</h1>
      <p className="dica">Qualquer Membro sugere e apoia; o Ministro promove pra uma Escala.</p>

      <button type="button" className="botao largo" onClick={() => sugerir('escolhendo')}>
        + Sugerir uma música
      </button>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {lista.length === 0 ? (
        <p className="vazio">Nenhuma Sugestão aberta.</p>
      ) : (
        <ul className="lista cartao">
          {lista.map((sugestao) => (
            <li key={sugestao.id} className="item">
              <Capa musicas={[escolhaDaSugestao(sugestao).resumo]} />

              <div className="cresce">
                <div className="titulo">{sugestao.titulo}</div>
                <div className="dica">
                  {sugestao.membro.nome}, {diaDaSugestao(sugestao.data)}
                </div>
                {sugestao.observacao && <div className="observacao">{sugestao.observacao}</div>}
                <div className="dica">{textoDosApoios(sugestao.apoios)}</div>
              </div>

              <div className="acoes">
                <button
                  type="button"
                  className={'botao pequeno' + (sugestao.apoiei ? '' : ' secundario')}
                  aria-pressed={sugestao.apoiei}
                  disabled={acao.ocupado}
                  onClick={() =>
                    acao.executar(async () => {
                      trocar(
                        await api<SugestaoApresentada>(`/api/sugestoes/${sugestao.id}/apoiar`, {
                          metodo: sugestao.apoiei ? 'DELETE' : 'POST',
                        }),
                      )
                    })
                  }
                >
                  {sugestao.apoiei ? 'Apoiado' : 'Apoiar'}
                </button>

                {dirige && (
                  <button type="button" className="botao pequeno" onClick={() => escolher(sugestao)}>
                    Promover
                  </button>
                )}

                {podeApagar(sugestao, eu) && (
                  <button
                    type="button"
                    className="botao secundario icone"
                    aria-label={`Apagar ${sugestao.titulo}`}
                    disabled={acao.ocupado}
                    onClick={() =>
                      acao.executar(async () => {
                        await api(`/api/sugestoes/${sugestao.id}`, { metodo: 'DELETE' })
                        busca.recarregar()
                      })
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {promovendo && (
        <Folha titulo="Pra qual Escala?" fechar={() => escolher(null)}>
          {agendadas.length === 0 ? (
            <p className="dica">Nenhuma Escala Agendada. Crie o mês antes de promover.</p>
          ) : (
            <ul className="lista">
              {agendadas.map((escala) => (
                <li key={escala.id}>
                  <button
                    type="button"
                    className="toque"
                    onClick={() => navegar(`/escalas/${escala.id}/adicionar?sugestao=${promovendo.id}`)}
                  >
                    <span className="cresce">
                      <span className="titulo">{escala.titulo}</span>
                      <span className="dica">{rotuloDoDia(escala.data)}</span>
                    </span>
                    <span className="dica">
                      {escala.quantidadeNaEquipe ? `${escala.quantidadeNaEquipe} na Equipe` : 'sem Equipe'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Folha>
      )}
    </section>
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

  const enviar = () => {
    acao.executar(async () => {
      await api('/api/sugestoes', { metodo: 'POST', corpo: corpoDaSugestao(escolha, observacao) })
      aoEnviar()
    })
  }

  return (
    <section className="pagina">
      <Barra titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} grande />
        <p className="dica">
          {escolha.musicaId
            ? 'Está no catálogo. O Ministro vê a Sugestão e os apoios.'
            : 'Ainda não está no catálogo: entra quando o Ministro promover.'}
        </p>
      </div>

      <label className="campo">
        <span className="rotulo">Por que essa música?</span>
        <input
          placeholder="opcional: cabe no fim, combina com a Santa Ceia…"
          value={observacao}
          onChange={(evento) => escrever(evento.target.value)}
        />
      </label>

      <p className="dica">Sugerir já conta como o seu apoio.</p>

      <button type="button" className="botao largo" disabled={acao.ocupado} onClick={enviar}>
        Enviar Sugestão
      </button>
    </section>
  )
}
