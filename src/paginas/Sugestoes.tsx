import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaResumida, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Capa } from '../componentes/Capa'
import { EscolhaDeMusica } from '../componentes/EscolhaDeMusica'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { LinhaDeMusica } from '../componentes/LinhaDeMusica'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Selo } from '../componentes/Selo'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { Vazio } from '../componentes/Vazio'
import { formatarDia } from '../dominio'
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
  const avisar = usarAviso()
  const pendente = usarRemocaoPendente()
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

  const cabecalho = <Cabecalho raiz titulo="Sugestões" />

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

  const lista = busca.dados.sugestoes
  const agendadas = (escalas.dados?.escalas ?? []).filter((escala) => escala.estado === 'agendada')

  function apagar(sugestao: SugestaoApresentada) {
    pendente.agendar(sugestao.id, () =>
      acao.executar(async () => {
        await api(`/api/sugestoes/${sugestao.id}`, { metodo: 'DELETE' })
        busca.recarregar()
      }),
    )
    avisar('Sugestão apagada', { desfazer: () => pendente.desfazer(sugestao.id) })
  }

  return (
    <section className="pagina">
      {cabecalho}

      <Botao largo onClick={() => sugerir('escolhendo')}>
        + Sugerir uma música
      </Botao>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {lista.length === 0 ? (
        <Vazio icone="lampada">Nenhuma Sugestão aberta.</Vazio>
      ) : (
        <ul className="lista cartao">
          {lista.map((sugestao) => {
            if (pendente.pendentes.includes(sugestao.id)) return null

            return (
              <LinhaDeMusica
                key={sugestao.id}
                musica={escolhaDaSugestao(sugestao).resumo}
                modo="leitura"
                observacao={sugestao.observacao || undefined}
                selos={
                  <Selo>
                    {sugestao.membro.nome}, {diaDaSugestao(sugestao.data)} · {textoDosApoios(sugestao.apoios)}
                  </Selo>
                }
                direita={
                  <>
                    <Botao
                      variante={sugestao.apoiei ? 'primario' : 'secundario'}
                      pequeno
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
                    </Botao>

                    {dirige && (
                      <Botao pequeno onClick={() => escolher(sugestao)}>
                        Promover
                      </Botao>
                    )}

                    {podeApagar(sugestao, eu) && (
                      <Botao
                        variante="icone"
                        icone="remover"
                        aria-label={`Apagar ${sugestao.titulo}`}
                        disabled={acao.ocupado}
                        onClick={() => apagar(sugestao)}
                      />
                    )}
                  </>
                }
              />
            )
          })}
        </ul>
      )}

      {promovendo && (
        <Folha titulo="Pra qual Escala?" fechar={() => escolher(null)}>
          {agendadas.length === 0 ? (
            <Vazio icone="calendario">Nenhuma Escala Agendada. Crie o mês antes de promover.</Vazio>
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
                      <span className="dica">{formatarDia(escala.data)}</span>
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
      <Cabecalho titulo={escolha.resumo.titulo} sub={escolha.resumo.artista} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="cabecalho-da-musica">
        <Capa musicas={[escolha.resumo]} grande />
      </div>

      <Campo rotulo="Por que essa música?">
        <input
          placeholder="opcional: cabe no fim, combina com a Santa Ceia…"
          value={observacao}
          onChange={(evento) => escrever(evento.target.value)}
        />
      </Campo>

      <RodapeDeAcao
        primario={
          <Botao largo disabled={acao.ocupado} onClick={enviar}>
            Enviar Sugestão
          </Botao>
        }
      />
    </section>
  )
}
