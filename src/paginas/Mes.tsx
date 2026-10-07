import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaApresentada, EscalaResumida } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { Botao } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { Selo } from '../componentes/Selo'
import { SeletorDeMes } from '../componentes/SeletorDeMes'
import { Vazio } from '../componentes/Vazio'
import { VistoEm } from '../componentes/VistoEm'
import { hojeEmBrasilia, nomeDaEscala, nomeDoDia } from '../dominio'
import {
  deslocarMes,
  dicaDaEscala,
  domingosQueFaltam,
  linhasDoMes,
  mesDaData,
  nomeDoMes,
  passadasEProximas,
  resumoDoMes,
  rotuloDoMes,
  selosDaEscala,
  textoDeCriarDomingos,
} from '../escalas/mes'
import { marcarTarefa } from '../guia/andamento'
import { usarEu } from '../sessao/sessao'

export function Mes() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const hoje = hojeEmBrasilia()
  const [mes, verMes] = useState(() => mesDaData(hoje))
  const [folha, abrirFolha] = useState<'nova' | 'seletor' | null>(null)
  const [mostrandoPassadas, mostrarPassadas] = useState(false)
  const busca = usarBusca<{ escalas: EscalaResumida[] }>(`/api/escalas?mes=${mes}`)
  const acao = usarAcao()

  const escalas = busca.dados?.escalas ?? []
  const faltam = domingosQueFaltam(
    mes,
    escalas.map((escala) => escala.data),
  )
  const { passadas, proximas } = passadasEProximas(linhasDoMes(escalas, mes, hoje), hoje)

  function criarDomingos() {
    acao.executar(async () => {
      await api('/api/escalas/mes', { metodo: 'POST', corpo: { mes } })
      marcarTarefa('criar-escalas')
      busca.recarregar()
    })
  }

  return (
    <section className="pagina">
      <Cabecalho
        raiz
        titulo={rotuloDoMes(mes)}
        tituloRico={
          <button type="button" className="titulo-do-mes" onClick={() => abrirFolha('seletor')}>
            {nomeDoMes(mes)}
            <span className="dica">{mes.slice(0, 4)}</span>
            <Icone nome="seta" />
          </button>
        }
        navegacao={
          <>
            <Botao
              variante="icone"
              icone="voltar"
              aria-label="Mês anterior"
              onClick={() => verMes(deslocarMes(mes, -1))}
            />
            <Botao variante="icone" icone="seta" aria-label="Próximo mês" onClick={() => verMes(deslocarMes(mes, 1))} />
          </>
        }
        acao={
          dirige ? (
            <Botao variante="secundario" pequeno icone="mais" onClick={() => abrirFolha('nova')} data-guia="nova-escala">
              Nova escala
            </Botao>
          ) : undefined
        }
      />

      <VistoEm hora={busca.vistoEm} />

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {busca.carregando && <Esqueleto forma="linha-de-musica" quantidade={4} />}

      {busca.dados && escalas.length === 0 && (
        <Vazio
          icone="calendario"
          acao={
            dirige && faltam.length > 0 ? (
              <Botao disabled={acao.ocupado} onClick={criarDomingos} data-guia="criar-domingos">
                {textoDeCriarDomingos(faltam.length, true)}
              </Botao>
            ) : undefined
          }
        >
          Nenhuma escala em {nomeDoMes(mes).toLowerCase()}
        </Vazio>
      )}

      {escalas.length > 0 && <p className="dica resumo-do-mes">{resumoDoMes(escalas)}</p>}

      {passadas.length > 0 && (
        <button
          type="button"
          className="cartao recolhidas"
          aria-expanded={mostrandoPassadas}
          onClick={() => mostrarPassadas(!mostrandoPassadas)}
        >
          <Icone nome="confirmar" />
          <span className="cresce">
            {passadas.length === 1 ? '1 escala já passou' : `${passadas.length} escalas já passaram`}
          </span>
          <span className="acao-de-recolher">{mostrandoPassadas ? 'Esconder' : 'Mostrar'}</span>
        </button>
      )}

      {mostrandoPassadas && passadas.length > 0 && (
        <ul className="lista cartao mes">
          {passadas.map(
            (linha) =>
              linha.tipo === 'escala' && (
                <LinhaDoMes key={linha.escala.id} escala={linha.escala} ehHoje={false} dirige={dirige} />
              ),
          )}
        </ul>
      )}

      {escalas.length > 0 && (
        <ul className="lista cartao mes">
          {proximas.map((linha) =>
            linha.tipo === 'nada' ? (
              <li key="nada-hoje" className="nada-hoje">
                <span className="dia hoje">
                  <b>{Number(linha.data.slice(8))}</b>
                  <span>{nomeDoDia(linha.data)}</span>
                </span>
                <span className="dica">Hoje não tem nada marcado</span>
              </li>
            ) : (
              <LinhaDoMes key={linha.escala.id} escala={linha.escala} ehHoje={linha.hoje} dirige={dirige} />
            ),
          )}
        </ul>
      )}

      {dirige && escalas.length > 0 && faltam.length > 0 && (
        <Botao variante="secundario" largo disabled={acao.ocupado} onClick={criarDomingos} data-guia="criar-domingos">
          {textoDeCriarDomingos(faltam.length, false)}
        </Botao>
      )}

      {folha === 'nova' && <FolhaDaNovaEscala mes={mes} fechar={() => abrirFolha(null)} />}
      {folha === 'seletor' && <SeletorDeMes mes={mes} hoje={hoje} fechar={() => abrirFolha(null)} aoEscolher={verMes} />}
    </section>
  )
}

function LinhaDoMes({ escala, ehHoje, dirige }: { escala: EscalaResumida; ehHoje: boolean; dirige: boolean }) {
  const selos = selosDaEscala(escala, dirige)

  return (
    <li className={escala.estado === 'realizada' ? 'realizada' : undefined}>
      <Link to={`/escalas/${escala.id}`} className="toque">
        <span className={ehHoje ? 'dia hoje' : 'dia'}>
          <b>{Number(escala.data.slice(8))}</b>
          <span>{ehHoje ? 'hoje' : nomeDoDia(escala.data)}</span>
        </span>
        <span className="cresce">
          <span className="titulo">{nomeDaEscala(escala)}</span>
          <span className="dica">{dicaDaEscala(escala)}</span>
          {selos.length > 0 && (
            <span className="selos">
              {selos.map((selo) => (
                <Selo key={selo.chave} variante={selo.variante}>
                  {selo.texto}
                </Selo>
              ))}
            </span>
          )}
        </span>
        <Icone nome="seta" />
      </Link>
    </li>
  )
}

function FolhaDaNovaEscala({ mes, fechar }: { mes: string; fechar: () => void }) {
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
      marcarTarefa('criar-escalas')
      navegar(`/escalas/${escala.id}`)
    })
  }

  return (
    <Folha titulo="Nova escala" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Campo rotulo="Nome">
        <input value={rotulo} placeholder="Conferência" onChange={(e) => escreverRotulo(e.target.value)} />
      </Campo>

      <Campo rotulo="Data">
        <input type="date" value={data} onChange={(e) => escreverData(e.target.value)} />
      </Campo>

      <Campo rotulo="Horário">
        <input type="time" value={horario} onChange={(e) => escreverHorario(e.target.value)} />
      </Campo>

      <Botao largo disabled={acao.ocupado} onClick={criar}>
        Criar
      </Botao>
    </Folha>
  )
}
