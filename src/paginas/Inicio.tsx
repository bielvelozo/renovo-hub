import { useState } from 'react'
import { Link } from 'react-router'
import { temLetraNoItem } from '../api/anexos'
import { api } from '../api/cliente'
import type { Anexo, EscalaApresentada, EscalaResumida, InicioApresentado, PosCultoApresentado, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { Botao, BotaoLink } from '../componentes/Botao'
import { usarAviso } from '../componentes/Avisos'
import { Cartao } from '../componentes/Cartao'
import { ErroDeCarga } from '../componentes/ErroDeCarga'
import { Esqueleto } from '../componentes/Esqueleto'
import { FolhaDaPlaylist } from '../componentes/FolhasDaEscala'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { VistoEm } from '../componentes/VistoEm'
import { hojeEmBrasilia, nomeDaEscala, nomeDoDia, rotuloDoHorario } from '../dominio'
import { nomeDoMes } from '../escalas/mes'
import { CHAVE_DE_VISITA_DAS_SUGESTOES } from '../escalas/sugestoes'
import { mudouDesdeAVisita, visitaNaEscala } from '../escalas/visita'
import { chaveDoPosCultoFechado, quandoAcontece, resumoDaProximaEscala, textoDeSugestoesNovas, textoDoPosCulto } from '../inicio/inicio'
import { usarEu, usarEuTalvez } from '../sessao/sessao'

export function Inicio() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const hoje = hojeEmBrasilia()
  const busca = usarBusca<InicioApresentado>('/api/inicio')
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes')
  const acao = usarAcao()

  const cabecalho = (
    <Cabecalho
      raiz
      titulo={`Oi, ${eu.nome}`}
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
        {cabecalho}
        <ErroDeCarga mensagem={busca.erro} tentarDeNovo={busca.recarregar} />
      </section>
    )
  }

  if (!busca.dados) {
    return (
      <section className="pagina">
        {cabecalho}
        <VistoEm hora={busca.vistoEm} />
        <Esqueleto forma="cartao" />
        <Esqueleto forma="linha-de-musica" quantidade={3} />
      </section>
    )
  }

  const dados = busca.dados
  const escala = dados.minhaProxima ?? dados.proximoCulto

  function criarMes(mes: string) {
    acao.executar(async () => {
      await api('/api/escalas/mes', { metodo: 'POST', corpo: { mes } })
      busca.recarregar()
    })
  }

  return (
    <section className="pagina">
      {cabecalho}
      <VistoEm hora={busca.vistoEm} />

      {dados.posCulto && <CartaoPosCulto key={dados.posCulto.escalaId} posCulto={dados.posCulto} hoje={hoje} />}

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
            ) : undefined
          }
        >
          Nenhuma escala marcada
        </Vazio>
      )}

      {acao.erro && (
        <p className="aviso" role="alert">
          {acao.erro}
        </p>
      )}

      {escala && <CartaoDoCulto escala={escala} hoje={hoje} />}

      {escala && <RepertorioDoInicio escala={escala} anexosPorDono={dados.anexosPorDono} hoje={hoje} />}

      {dados.pendencias.length > 0 && <Pendencias escalas={dados.pendencias} />}

      <LinhaDeSugestoes sugestoes={sugestoes.dados?.sugestoes ?? []} />
    </section>
  )
}

export function CartaoDoCulto({ escala, hoje }: { escala: EscalaApresentada; hoje: string }) {
  if (escala.data !== hoje) return null

  const musicas = escala.itens.length === 1 ? '1 música' : escala.itens.length + ' músicas'

  return (
    <Cartao className="pagina cartao-do-culto">
      <div className="secao-topo">
        <div className="cresce">
          <div className="titulo">Culto de hoje</div>
          <div className="dica">
            {musicas} · {rotuloDoHorario(escala.horario)}
          </div>
        </div>
        <BotaoLink para={`/culto/${escala.id}`} pequeno>
          Modo culto
        </BotaoLink>
      </div>
    </Cartao>
  )
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

  return (
    <div className="secao">
      <h2>{minha ? 'Sua próxima escala' : 'Próximo culto'}</h2>

      <Cartao className="proxima-escala">
        <div className="topo-da-proxima">
          <span className="dia destaque">
            <b>{Number(escala.data.slice(8))}</b>
            <span>{nomeDoDia(escala.data)}</span>
          </span>
          <div className="cresce">
            <h3 className="titulo-do-cartao">{nomeDaEscala(escala)}</h3>
            <div className="dica">
              {rotuloDoHorario(escala.horario)} · {quandoAcontece(escala.data, hoje)}
            </div>
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
                  </span>
                  <span className="dica">{resumo.total === 1 ? '1 pessoa' : `${resumo.total} pessoas`}</span>
                </>
              ) : (
                <span className="dica">Ninguém escalado ainda</span>
              )}
            </dd>
          </div>
        </dl>

        <BotaoLink para={`/escalas/${escala.id}`} largo>
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
              letraEm={
                temLetraNoItem(item, anexosPorDono) ? `/escalas/${escala.id}/itens/${item.id}/letra` : undefined
              }
              selos={mudouDesdeAVisita(item.atualizadoEm, visita) ? <Selo variante="atencao">mudou</Selo> : undefined}
            />
          ))}
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

function Pendencias({ escalas }: { escalas: EscalaResumida[] }) {
  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>Precisa de atenção · 4 semanas</h2>
        <BotaoLink para="/mes" variante="terciario" pequeno>
          Mês <Icone nome="seta" />
        </BotaoLink>
      </div>

      <ul className="lista cartao">
        {escalas.map((escala) => (
          <li key={escala.id}>
            <Link to={`/escalas/${escala.id}`} className="toque">
              <span className="dia">
                <b>{Number(escala.data.slice(8))}</b>
                <span>{nomeDoDia(escala.data)}</span>
              </span>
              <span className="cresce">
                <span className="titulo">{nomeDaEscala(escala)}</span>
                <span className="estado atencao">
                  <Icone nome="atencao" />
                  {escala.pendencias.map((pendencia) => pendencia.texto).join(' · ')}
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
