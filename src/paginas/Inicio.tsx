import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { temLetraNoItem } from '../api/anexos'
import { api } from '../api/cliente'
import type { Anexo, EscalaApresentada, EscalaResumida, InicioApresentado, PosCultoApresentado, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { Botao, BotaoLink } from '../componentes/Botao'
import { AtalhoDoCulto } from '../componentes/AtalhoDoCulto'
import { usarAviso } from '../componentes/Avisos'
import { Cartao } from '../componentes/Cartao'
import { ErroDeCarga } from '../componentes/ErroDeCarga'
import { Esqueleto } from '../componentes/Esqueleto'
import { FolhaDaPlaylist } from '../componentes/FolhasDaEscala'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { VistoEm } from '../componentes/VistoEm'
import { formatarDia, hojeEmBrasilia, nomeDaEscala, nomeDoDia, rotuloDoHorario } from '../dominio'
import { nomeDoMes } from '../escalas/mes'
import { CHAVE_DE_VISITA_DAS_SUGESTOES } from '../escalas/sugestoes'
import { mudouDesdeAVisita, visitaNaEscala } from '../escalas/visita'
import {
  chaveDoPosCultoFechado,
  destinoDaPendencia,
  ministraAEscala,
  pendenciasVemAntes,
  quandoAcontece,
  resumoDaProximaEscala,
  resumoDasPendencias,
  textoDeSugestoesNovas,
  textoDoPosCulto,
  tituloDasPendencias,
  tituloDoInicio,
} from '../inicio/inicio'
import { usarEu, usarEuTalvez } from '../sessao/sessao'

export function Inicio() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const hoje = hojeEmBrasilia()
  const busca = usarBusca<InicioApresentado>('/api/inicio')
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes')
  const acao = usarAcao()

  const cabecalho = (tituloRico?: ReactNode) => (
    <Cabecalho
      raiz
      titulo={`Oi, ${eu.nome}`}
      tituloRico={tituloRico}
      legenda={<VistoEm hora={busca.vistoEm} />}
      acao={
        eu.admin ? (
          <BotaoLink variante="icone" icone="engrenagem" para="/admin" aria-label="Administração" />
        ) : undefined
      }
    />
  )

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho()}
        <ErroDeCarga mensagem={busca.erro} tentarDeNovo={busca.recarregar} />
      </section>
    )
  }

  if (!busca.dados) {
    return (
      <section className="pagina">
        {cabecalho(<span className="osso osso-do-titulo" role="img" aria-label="Carregando" />)}
        <Esqueleto forma="cartao" rotulo />
        <Esqueleto forma="linha-de-musica" quantidade={3} rotulo />
      </section>
    )
  }

  const dados = busca.dados
  const escala = dados.minhaProxima ?? dados.proximoCulto
  const pendencias = dados.pendencias.length > 0 && <Pendencias escalas={dados.pendencias} hoje={hoje} />
  const pendenciasAntes =
    escala !== null && pendenciasVemAntes(dados.pendencias, escala.data, ministraAEscala(escala.pessoas, eu.id))

  function criarMes(mes: string) {
    acao.executar(async () => {
      await api('/api/escalas/mes', { metodo: 'POST', corpo: { mes } })
      busca.recarregar()
    })
  }

  return (
    <section className="pagina">
      {cabecalho(escala ? tituloDoInicio(escala.data, hoje) : undefined)}

      {dados.posCulto && <CartaoPosCulto key={dados.posCulto.escalaId} posCulto={dados.posCulto} hoje={hoje} />}

      {escala && <CultoDeHoje escala={escala} hoje={hoje} />}

      {escala ? (
        <ProximaEscala escala={escala} minha={dados.minhaProxima !== null} euId={eu.id} hoje={hoje} />
      ) : (
        <Vazio
          icone="calendario"
          acao={
            dirige && dados.proximoMesVazio ? (
              <Botao carregando={acao.ocupado} onClick={() => criarMes(dados.proximoMesVazio!)}>
                Criar as escalas de {nomeDoMes(dados.proximoMesVazio).toLowerCase()}
              </Botao>
            ) : dirige ? (
              <BotaoLink para="/mes" variante="secundario">
                Abrir o mês
              </BotaoLink>
            ) : undefined
          }
        >
          {dirige ? 'Nenhuma escala marcada.' : 'Nenhuma escala marcada. Quando o Ministro montar o mês, a sua aparece aqui.'}
        </Vazio>
      )}

      {acao.erro && (
        <p className="aviso" role="alert">
          {acao.erro}
        </p>
      )}

      {pendenciasAntes && pendencias}

      {escala && <RepertorioDoInicio escala={escala} anexosPorDono={dados.anexosPorDono} hoje={hoje} />}

      {!pendenciasAntes && pendencias}

      <LinhaDeSugestoes sugestoes={sugestoes.dados?.sugestoes ?? []} />
    </section>
  )
}

export function CultoDeHoje({ escala, hoje }: { escala: EscalaApresentada; hoje: string }) {
  if (escala.data !== hoje) return null

  return <AtalhoDoCulto escalaId={escala.id} dica={`Hoje às ${rotuloDoHorario(escala.horario)} · letras e tons, sem internet`} />
}

export function CartaoPosCulto({ posCulto, hoje }: { posCulto: PosCultoApresentado; hoje: string }) {
  const chave = chaveDoPosCultoFechado(posCulto.escalaId)
  const [fechado, fechar] = useState(() => localStorage.getItem(chave) !== null)
  const avisar = usarAviso()

  if (fechado) return null

  function fecharComDesfazer() {
    localStorage.setItem(chave, new Date().toISOString())
    fechar(true)
    avisar('Fechado', {
      desfazer: () => {
        localStorage.removeItem(chave)
        fechar(false)
      },
    })
  }

  return (
    <Cartao className="pagina pos-culto">
      <div className="secao-topo">
        <Icone nome="confirmar" />
        <div className="cresce">
          <h2 className="titulo">{textoDoPosCulto(posCulto, hoje)}</h2>
          <div className="dica">O histórico já foi salvo. Só ajuste se alguma música ou tom mudou na hora.</div>
        </div>
        <Botao variante="icone" icone="remover" aria-label="Fechar" onClick={fecharComDesfazer} />
      </div>
      <div>
        <BotaoLink para={`/escalas/${posCulto.escalaId}`} variante="terciario" pequeno>
          Ajustar o que foi tocado
        </BotaoLink>
      </div>
    </Cartao>
  )
}

function ProximaEscala({
  escala,
  minha,
  euId,
  hoje,
}: {
  escala: EscalaApresentada
  minha: boolean
  euId: string
  hoje: string
}) {
  const resumo = resumoDaProximaEscala(escala.pessoas, minha ? euId : '')
  const ehHoje = escala.data === hoje

  return (
    <div className="secao">
      <h2>{minha ? 'Sua próxima escala' : 'Próximo culto'}</h2>

      <Cartao className="proxima-escala">
        <div className="topo-da-proxima">
          <h3 className="titulo-do-cartao">{nomeDaEscala(escala)}</h3>
          <div className="dica">
            {rotuloDoHorario(escala.horario)} · {quandoAcontece(escala.data, hoje)}
          </div>
        </div>

        <dl className="fatos">
          <div>
            <dt>{minha ? 'Sua função' : 'Você'}</dt>
            <dd className={minha ? 'forte' : undefined}>{resumo.suaFuncao ?? 'não está nesta escala'}</dd>
          </div>
          {resumo.ministros && (
            <div>
              <dt>Ministro</dt>
              <dd>{resumo.ministros}</dd>
            </div>
          )}
          <div>
            <dt>Equipe</dt>
            <dd>
              {resumo.total ? (
                <>
                  <span className="pilha-de-iniciais" aria-hidden="true">
                    {resumo.iniciais.map((inicial, posicao) => (
                      <span key={posicao} className="inicial mini">
                        {inicial}
                      </span>
                    ))}
                    {resumo.extras > 0 && <span className="inicial mini">+{resumo.extras}</span>}
                  </span>
                  <span className="dica">{resumo.total === 1 ? '1 pessoa' : `${resumo.total} pessoas`}</span>
                </>
              ) : (
                <span className="dica">Ninguém escalado ainda</span>
              )}
            </dd>
          </div>
        </dl>

        <BotaoLink
          para={`/escalas/${escala.id}`}
          variante={ehHoje ? 'secundario' : 'primario'}
          largo
          aria-label={`Abrir escala de ${formatarDia(escala.data, hoje)}`}
        >
          Abrir escala
        </BotaoLink>
      </Cartao>
    </div>
  )
}

export function RepertorioDoInicio({
  escala,
  anexosPorDono,
  hoje,
}: {
  escala: EscalaApresentada
  anexosPorDono: Record<string, Anexo[]>
  hoje: string
}) {
  const eu = usarEuTalvez()
  const dirige = Boolean(eu?.ministro || eu?.admin)
  const [playlist, abrirPlaylist] = useState(false)
  const visita = visitaNaEscala(escala.id)

  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>Repertório</h2>
        {escala.itens.length > 0 && (
          <Botao variante="terciario" pequeno icone="play" onClick={() => abrirPlaylist(true)}>
            Ouvir tudo
          </Botao>
        )}
      </div>

      {escala.itens.length ? (
        <ul className="lista cartao">
          {escala.itens.map((item, indice) => (
            <LinhaDoItem
              key={item.id}
              item={item}
              modo="leitura"
              numero={indice + 1}
              hoje={hoje}
              posicaoDoTom="direita"
              letraEm={
                temLetraNoItem(item, anexosPorDono) ? `/escalas/${escala.id}/itens/${item.id}/letra` : undefined
              }
              selos={mudouDesdeAVisita(item.atualizadoEm, visita) ? <Selo variante="atencao">mudou</Selo> : undefined}
            />
          ))}
          {dirige && (
            <li>
              <Link to={`/escalas/${escala.id}/adicionar`} className="toque">
                <Icone nome="mais" />
                <span className="cresce titulo">Adicionar música</span>
                <Icone nome="seta" />
              </Link>
            </li>
          )}
        </ul>
      ) : dirige ? (
        <p className="dica">
          Você ainda não escolheu as músicas.{' '}
          <Link to={`/escalas/${escala.id}/adicionar`}>Adicionar música</Link>
        </p>
      ) : (
        <p className="dica">O Ministro ainda não escolheu as músicas.</p>
      )}

      {playlist && <FolhaDaPlaylist escalaId={escala.id} itens={escala.itens} fechar={() => abrirPlaylist(false)} />}
    </div>
  )
}

function Pendencias({ escalas, hoje }: { escalas: EscalaResumida[]; hoje: string }) {
  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>{tituloDasPendencias(hoje)}</h2>
        <BotaoLink para="/mes" variante="terciario" pequeno aria-label="Mês: todas as escalas">
          Mês <Icone nome="seta" />
        </BotaoLink>
      </div>

      <ul className="lista cartao">
        {escalas.map((escala) => (
          <li key={escala.id}>
            <Link to={destinoDaPendencia(escala.id, escala.pendencias)} className="toque">
              <span className="dia">
                <b>{Number(escala.data.slice(8))}</b>
                <span>{nomeDoDia(escala.data)}</span>
              </span>
              <span className="cresce">
                <span className="titulo">{nomeDaEscala(escala)}</span>
                <span className="estado">
                  <Icone nome="atencao" />
                  {resumoDasPendencias(escala.pendencias)}
                </span>
              </span>
              <Icone nome="seta" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LinhaDeSugestoes({ sugestoes }: { sugestoes: SugestaoApresentada[] }) {
  const texto = textoDeSugestoesNovas(sugestoes, localStorage.getItem(CHAVE_DE_VISITA_DAS_SUGESTOES))

  if (!texto) return null

  return (
    <div className="secao">
      <h2>Sugestões</h2>
      <ul className="lista cartao">
        <li>
          <Link to="/sugestoes" className="toque">
            <Icone nome="lampada" />
            <span className="cresce titulo">{texto}</span>
            <Icone nome="seta" />
          </Link>
        </li>
      </ul>
    </div>
  )
}
