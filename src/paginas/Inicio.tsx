import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/cliente'
import type { Anexo, EscalaApresentada, EscalaResumida, InicioApresentado, PosCultoApresentado, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { Esqueleto } from '../componentes/Esqueleto'
import { FolhaDaPlaylist } from '../componentes/FolhasDaEscala'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { VistoEm } from '../componentes/VistoEm'
import { hojeEmBrasilia, musicasDoItem, nomeDaEscala, nomeDoDia, nomeDoDiaLongo } from '../dominio'
import { nomeDoMes } from '../escalas/mes'
import { CHAVE_DE_VISITA_DAS_SUGESTOES } from '../escalas/sugestoes'
import { mudouDesdeAVisita, visitaNaEscala } from '../escalas/visita'
import { chaveDoPosCultoFechado, linhaDaEscala, selosDaEquipe, textoDeSugestoesNovas, textoDoPosCulto } from '../inicio/inicio'
import { usarEu } from '../sessao/sessao'

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
        <p className="aviso">{busca.erro}</p>
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
              <Botao disabled={acao.ocupado} onClick={() => criarMes(dados.proximoMesVazio!)}>
                Criar as escalas de {nomeDoMes(dados.proximoMesVazio).toLowerCase()}
              </Botao>
            ) : undefined
          }
        >
          Nenhuma escala marcada
        </Vazio>
      )}

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {escala && <RepertorioDoInicio escala={escala} anexosPorMusica={dados.anexosPorMusica} hoje={hoje} />}

      {dados.pendencias.length > 0 && <Pendencias escalas={dados.pendencias} />}

      <LinhaDeSugestoes sugestoes={sugestoes.dados?.sugestoes ?? []} />
    </section>
  )
}

export function CartaoPosCulto({ posCulto, hoje }: { posCulto: PosCultoApresentado; hoje: string }) {
  const [fechado, fechar] = useState(() => localStorage.getItem(chaveDoPosCultoFechado(posCulto.escalaId)) !== null)

  if (fechado) return null

  return (
    <Cartao className="pagina pos-culto">
      <div className="secao-topo">
        <div className="cresce">
          <div className="titulo">{textoDoPosCulto(posCulto, hoje)}</div>
          <div className="dica">Tocaram todas? Algum tom mudou?</div>
        </div>
        <Botao
          variante="icone"
          icone="remover"
          aria-label="Fechar"
          onClick={() => {
            localStorage.setItem(chaveDoPosCultoFechado(posCulto.escalaId), new Date().toISOString())
            fechar(true)
          }}
        />
      </div>
      <div>
        <BotaoLink para={`/escalas/${posCulto.escalaId}`} variante="secundario" pequeno>
          Ajustar
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
  const selos = selosDaEquipe(escala.pessoas, minha ? euId : '')

  return (
    <div className="secao">
      <h2>{minha ? 'Sua próxima escala' : 'Próximo culto'}</h2>

      <Cartao destaque className="pagina">
        {!minha && <p className="dica">Você não está em nenhuma escala agendada</p>}

        <div className="secao-topo">
          <div className="cresce">
            <div className="titulo">{nomeDaEscala(escala)}</div>
            <div className="dica">{linhaDaEscala(escala, hoje)}</div>
          </div>
          <BotaoLink para={`/escalas/${escala.id}`} variante="secundario" pequeno>
            Abrir
          </BotaoLink>
        </div>

        {selos.length ? (
          <span className="selos">
            {selos.map((selo) => (
              <Selo key={selo.membroId} variante={selo.variante}>
                {selo.texto}
              </Selo>
            ))}
          </span>
        ) : (
          <p className="dica">Ninguém escalado ainda</p>
        )}
      </Cartao>
    </div>
  )
}

export function RepertorioDoInicio({
  escala,
  anexosPorMusica,
  hoje,
}: {
  escala: EscalaApresentada
  anexosPorMusica: Record<string, Anexo[]>
  hoje: string
}) {
  const [playlist, abrirPlaylist] = useState(false)
  const visita = visitaNaEscala(escala.id)

  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>Repertório de {nomeDoDiaLongo(escala.data)}</h2>
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
              anexos={musicasDoItem(item).flatMap((musicaId) => anexosPorMusica[musicaId] ?? [])}
              selos={mudouDesdeAVisita(item.atualizadoEm, visita) ? <Selo variante="atencao">mudou</Selo> : undefined}
            />
          ))}
        </ul>
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
        <h2>Pendências · próximas 4 semanas</h2>
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
                <span className="selos">
                  {escala.pendencias.map((pendencia) => (
                    <Selo key={pendencia.chave + (pendencia.funcaoId ?? '')} variante="atencao">
                      {pendencia.texto}
                    </Selo>
                  ))}
                </span>
              </span>
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
    <ul className="lista cartao">
      <li>
        <Link to="/sugestoes" className="toque">
          <Icone nome="lampada" />
          <span className="cresce titulo">{texto}</span>
          <Icone nome="seta" />
        </Link>
      </li>
    </ul>
  )
}
