import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaApresentada, EscalaResumida } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Folha } from '../componentes/Folha'
import { Selos } from '../componentes/Selos'
import { hojeEmBrasilia, nomeDoDia } from '../dominio'
import { deslocarMes, domingosQueFaltam, mesDaData, nomeDoMes, rotuloDoMes } from '../escalas/mes'
import { usarEu } from '../sessao/sessao'

export function Mes() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const [mes, verMes] = useState(() => mesDaData(hojeEmBrasilia()))
  const [avulsa, abrirAvulsa] = useState(false)
  const busca = usarBusca<{ escalas: EscalaResumida[] }>(`/api/escalas?mes=${mes}`)
  const acao = usarAcao()

  const escalas = busca.dados?.escalas ?? []
  const faltam = domingosQueFaltam(
    mes,
    escalas.map((escala) => escala.data),
  )

  function criarDomingos() {
    acao.executar(async () => {
      await api('/api/escalas/mes', { metodo: 'POST', corpo: { mes } })
      busca.recarregar()
    })
  }

  return (
    <section className="pagina">
      <div className="mes-nav">
        <button
          type="button"
          className="botao secundario icone"
          aria-label="Mês anterior"
          onClick={() => verMes(deslocarMes(mes, -1))}
        >
          ‹
        </button>
        <h1>{rotuloDoMes(mes)}</h1>
        <button
          type="button"
          className="botao secundario icone"
          aria-label="Próximo mês"
          onClick={() => verMes(deslocarMes(mes, 1))}
        >
          ›
        </button>
      </div>

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {busca.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      {busca.dados && escalas.length === 0 && <p className="vazio">Nenhuma Escala em {nomeDoMes(mes)}.</p>}

      {escalas.length > 0 && (
        <ul className="lista cartao">
          {escalas.map((escala) => (
            <li key={escala.id}>
              <Link to={`/escalas/${escala.id}`} className="toque">
                <span className="dia">
                  <b>{escala.data.slice(8)}</b>
                  <span>{nomeDoDia(escala.data)}</span>
                </span>
                <span className="cresce">
                  <span className="titulo">{escala.titulo}</span>
                  <span className="dica">
                    {escala.quantidadeNaEquipe ? `${escala.quantidadeNaEquipe} na Equipe` : 'sem Equipe'}
                    {' · '}
                    {escala.quantidadeDeItens ? `${escala.quantidadeDeItens} no Repertório` : 'sem músicas'}
                    {escala.ministros.length > 0 && ` · ${escala.ministros.join(', ')}`}
                  </span>
                </span>
                <Selos estado={escala.estado} santaCeia={escala.santaCeia} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {dirige && busca.dados && (
        <div className="pagina">
          {faltam.length > 0 && (
            <>
              <button type="button" className="botao largo" disabled={acao.ocupado} onClick={criarDomingos}>
                Criar {faltam.length === 1 ? 'o domingo' : `os ${faltam.length} domingos`} de {nomeDoMes(mes)}
              </button>
              <p className="dica">O segundo domingo nasce Santa Ceia às 08h; os outros, Culto de Domingo 18h.</p>
            </>
          )}

          <button type="button" className="botao secundario largo" onClick={() => abrirAvulsa(true)}>
            Escala avulsa
          </button>
        </div>
      )}

      {avulsa && <FolhaDaAvulsa mes={mes} fechar={() => abrirAvulsa(false)} />}
    </section>
  )
}

function FolhaDaAvulsa({ mes, fechar }: { mes: string; fechar: () => void }) {
  const navegar = useNavigate()
  const acao = usarAcao()
  const [rotulo, escreverRotulo] = useState('')
  const [data, escreverData] = useState(`${mes}-01`)
  const [horario, escreverHorario] = useState('19:30')

  function criar() {
    acao.executar(async () => {
      const escala = await api<EscalaApresentada>('/api/escalas', {
        metodo: 'POST',
        corpo: { data, horario, rotulo: rotulo.trim() || 'Evento' },
      })
      navegar(`/escalas/${escala.id}`)
    })
  }

  return (
    <Folha titulo="Escala avulsa" fechar={fechar}>
      <p className="dica">Evento fora de domingo: nome, data e horário livres.</p>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={rotulo} placeholder="Conferência" onChange={(e) => escreverRotulo(e.target.value)} />
      </label>

      <label className="campo">
        <span className="rotulo">Data</span>
        <input type="date" value={data} onChange={(e) => escreverData(e.target.value)} />
      </label>

      <label className="campo">
        <span className="rotulo">Horário</span>
        <input type="time" value={horario} onChange={(e) => escreverHorario(e.target.value)} />
      </label>

      <button type="button" className="botao largo" disabled={acao.ocupado} onClick={criar}>
        Criar
      </button>
    </Folha>
  )
}
