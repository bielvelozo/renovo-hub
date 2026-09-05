import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { EscalaResumida, SugestaoApresentada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Capa } from '../componentes/Capa'
import { Folha } from '../componentes/Folha'
import { rotuloDoDia } from '../escalas/mes'
import { escolhaDaSugestao } from '../escalas/rascunho'
import { diaDaSugestao, textoDosApoios } from '../escalas/sugestoes'
import { usarEu } from '../sessao/sessao'

export function Sugestoes() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const navegar = useNavigate()
  const busca = usarBusca<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes')
  const escalas = usarBusca<{ escalas: EscalaResumida[] }>(dirige ? '/api/escalas' : null)
  const [promovendo, escolher] = useState<SugestaoApresentada | null>(null)

  if (busca.erro) return <p className="aviso">{busca.erro}</p>
  if (!busca.dados) return <div className="girando" role="status" aria-label="Carregando" />

  const lista = busca.dados.sugestoes
  const agendadas = (escalas.dados?.escalas ?? []).filter((escala) => escala.estado === 'agendada')

  return (
    <section className="pagina">
      <h1>Sugestões</h1>
      <p className="dica">Qualquer Membro sugere e apoia; o Ministro promove pra uma Escala.</p>

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

              {dirige && (
                <div className="acoes">
                  <button type="button" className="botao pequeno" onClick={() => escolher(sugestao)}>
                    Promover
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="dica">Sugerir uma música e apoiar as dos outros entram na próxima etapa do app.</p>

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
