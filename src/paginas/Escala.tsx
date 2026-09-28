import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { chaveDoItem, temLetraNoItem } from '../api/anexos'
import { api, textoDoErro } from '../api/cliente'
import type { Opcoes } from '../api/cliente'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { Alca } from '../componentes/Alca'
import { AtalhoDoCulto } from '../componentes/AtalhoDoCulto'
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Cartao } from '../componentes/Cartao'
import { ErroDeCarga } from '../componentes/ErroDeCarga'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { FolhaDoItem } from '../componentes/FolhaDoItem'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Menu } from '../componentes/Menu'
import type { ItemDoMenu } from '../componentes/Menu'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Rosto } from '../componentes/Rosto'
import { Selo } from '../componentes/Selo'
import { mover } from '../componentes/ordenacao'
import { usarOrdenacao } from '../componentes/usarOrdenacao'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { VistoEm } from '../componentes/VistoEm'
import { formatarDia, hojeEmBrasilia, nomeDaEscala, rotuloDoHorario } from '../dominio'
import { subtituloDaEscala } from '../escalas/cabecalho'
import { equipePorGrupo, linhaDaEquipe } from '../escalas/equipe'
import { ministrosDaEscala, textoDeQuemPuxa, tituloDoItem } from '../escalas/repertorio'
import { marcarVisitaNaEscala, mudouDesdeAVisita, visitaNaEscala } from '../escalas/visita'
import { destinoDaPendencia, resumoDasPendencias } from '../inicio/inicio'
import { marcarTarefa } from '../guia/andamento'
import { usarEu } from '../sessao/sessao'

type Aberta = 'editar' | 'cancelar' | 'whatsapp' | null

type Mudanca = (caminho: string, opcoes: Opcoes, aviso?: string) => void

export function Escala() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const hoje = hojeEmBrasilia()
  const busca = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const acao = usarAcao()
  const avisar = usarAviso()
  const [aberta, abrir] = useState<Aberta>(null)
  const [visita] = useState(() => visitaNaEscala(id))
  const chegada = useLocation().state as { itemNovo?: boolean } | null

  const escala = busca.dados

  // A marca «mudou» compara com a visita anterior, então a desta abertura só é
  // gravada depois de a tela renderizar com os selos.
  useEffect(() => {
    if (!escala) return
    marcarVisitaNaEscala(id)
    marcarTarefa('conferir-escala')
  }, [escala, id])

  const mudar: Mudanca = (caminho, opcoes, aviso) => {
    acao.executar(async () => {
      try {
        busca.definir(await api<EscalaApresentada>(caminho, opcoes))
      } catch (problema) {
        avisar(textoDoErro(problema))
        busca.recarregar()
        return
      }
      if (aviso) avisar(aviso)
    })
  }

  const cabecalho = (
    <>
      <Cabecalho
        titulo={escala ? nomeDaEscala(escala) : 'Escala'}
        sub={
          escala && (
            <>
              {subtituloDaEscala(escala, hoje)}
              {escala.estado === 'realizada' && <Selo variante="realizada">realizada</Selo>}
              {escala.estado === 'cancelada' && <Selo variante="cancelada">cancelada</Selo>}
            </>
          )
        }
        voltarPara="/mes"
        acao={escala ? <MenuDaEscala escala={escala} dirige={dirige} abrir={abrir} mudar={mudar} /> : undefined}
      />
      <VistoEm hora={busca.vistoEm} />
    </>
  )

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <ErroDeCarga mensagem={busca.erro} tentarDeNovo={busca.recarregar} />
      </section>
    )
  }

  if (!escala) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="cartao" />
      </section>
    )
  }

  const podeEditar = dirige && escala.estado !== 'cancelada'

  return (
    <section className="pagina">
      {cabecalho}

      {escala.estado === 'agendada' && escala.data === hoje && (
        <AtalhoDoCulto escalaId={id} dica={`Hoje às ${rotuloDoHorario(escala.horario)} · letras e tons, sem internet`} />
      )}

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {escala.estado === 'cancelada' && (
        <Cartao className="pagina cancelada">
          <p className="titulo">Este culto não vai acontecer</p>
          {dirige && (
            <Botao
              variante="secundario"
              pequeno
              disabled={acao.ocupado}
              onClick={() => mudar(`/api/escalas/${id}/desfazer`, { metodo: 'POST' }, 'Cancelamento desfeito')}
            >
              Desfazer
            </Botao>
          )}
        </Cartao>
      )}

      {escala.estado === 'realizada' && dirige && (
        <p className="dica">Já aconteceu. Mudanças aqui corrigem o histórico e não avisam ninguém.</p>
      )}

      <Repertorio
        escala={escala}
        dirige={dirige}
        podeEditar={podeEditar}
        acao={acao}
        mudar={mudar}
        definir={busca.definir}
        hoje={hoje}
        visita={visita}
        irAoUltimo={chegada?.itemNovo === true}
      />

      {dirige ? <EquipeResumida escala={escala} podeEditar={podeEditar} /> : <Equipe escala={escala} euId={eu.id} />}

      {podeEditar && (
        <RodapeDeAcao
          primario={
            <BotaoLink para={`/escalas/${id}/adicionar`} largo data-guia="adicionar-musica">
              Adicionar música
            </BotaoLink>
          }
          secundario={
            escala.estado === 'agendada' ? (
              <Botao variante="secundario" icone="whatsapp" onClick={() => abrir('whatsapp')}>
                WhatsApp
              </Botao>
            ) : undefined
          }
        />
      )}

      {aberta === 'editar' && (
        <FolhaDaData
          escala={escala}
          ocupado={acao.ocupado}
          fechar={() => abrir(null)}
          salvar={(corpo) => {
            mudar(`/api/escalas/${id}`, { metodo: 'PATCH', corpo }, 'Data e horário salvos')
            abrir(null)
          }}
        />
      )}

      {aberta === 'cancelar' && (
        <Folha titulo={'Não vai ter culto dia ' + formatarDia(escala.data, hoje) + '?'} fechar={() => abrir(null)}>
          <p className="dica">Dá pra desfazer depois.</p>
          <Botao
            variante="perigo"
            largo
            disabled={acao.ocupado}
            onClick={() => {
              mudar(`/api/escalas/${id}/cancelar`, { metodo: 'POST' }, 'Escala cancelada')
              abrir(null)
            }}
          >
            Sim, cancelar
          </Botao>
        </Folha>
      )}

      {aberta === 'whatsapp' && <FolhaDoWhatsapp escalaId={id} fechar={() => abrir(null)} />}
    </section>
  )
}

export function MenuDaEscala({
  escala,
  dirige,
  abrir,
  mudar,
}: {
  escala: EscalaApresentada
  dirige: boolean
  abrir: (aberta: Aberta) => void
  mudar: Mudanca
}) {
  const navegar = useNavigate()
  const ceia = escala.santaCeia
  const itens: ItemDoMenu[] = []

  if (escala.estado !== 'cancelada') {
    itens.push({ rotulo: 'Modo culto', icone: 'musica', aoEscolher: () => navegar(`/culto/${escala.id}`) })
  }

  if (dirige) {
    itens.push(
      { rotulo: 'Editar data e horário', icone: 'calendario', aoEscolher: () => abrir('editar') },
      {
        rotulo: ceia ? 'Tirar Santa Ceia' : 'Marcar como Santa Ceia',
        icone: 'confirmar',
        aoEscolher: () =>
          mudar(
            `/api/escalas/${escala.id}`,
            { metodo: 'PATCH', corpo: { santaCeia: !ceia } },
            ceia ? 'Não é mais Santa Ceia' : 'Agora é Santa Ceia',
          ),
      },
      escala.estado === 'cancelada'
        ? {
            rotulo: 'Desfazer cancelamento',
            icone: 'desfazer',
            aoEscolher: () => mudar(`/api/escalas/${escala.id}/desfazer`, { metodo: 'POST' }, 'Cancelamento desfeito'),
          }
        : {
            rotulo: 'Marcar como cancelada',
            icone: 'remover',
            perigo: true,
            aoEscolher: () => abrir('cancelar'),
          },
    )
  }

  if (!itens.length) return null

  return <Menu rotulo="Mais" itens={itens} />
}

export function EquipeResumida({ escala, podeEditar }: { escala: EscalaApresentada; podeEditar: boolean }) {
  const linha = linhaDaEquipe(escala.pessoas)
  const pendencias = escala.pendencias.filter((pendencia) => pendencia.chave !== 'sem-musicas')
  const destino = pendencias.length ? destinoDaPendencia(escala.id, pendencias) : `/escalas/${escala.id}/equipe`

  const conteudo = (
    <>
      {linha.total > 0 && (
        <span className="pilha-de-iniciais" aria-hidden="true">
          {linha.rostos.map((rosto) => (
            <Rosto key={rosto.membroId} {...rosto} tamanho="mini" />
          ))}
          {linha.extras > 0 && <span className="inicial mini">+{linha.extras}</span>}
        </span>
      )}
      <span className="cresce">
        <span className="titulo">
          {linha.total === 0 ? 'Ninguém escalado ainda' : linha.total === 1 ? '1 pessoa' : `${linha.total} pessoas`}
        </span>
        {linha.texto && <span className="dica">{linha.texto}</span>}
        {pendencias.length > 0 && (
          <span className="estado">
            <Icone nome="atencao" />
            {resumoDasPendencias(pendencias)}
          </span>
        )}
      </span>
      {podeEditar && <Icone nome="seta" />}
    </>
  )

  return (
    <div className="secao" data-guia="equipe">
      <div className="secao-topo">
        <h2>Equipe</h2>
        {podeEditar && (
          <BotaoLink para={`/escalas/${escala.id}/equipe`} variante="terciario" pequeno>
            {escala.pessoas.length ? 'Editar' : 'Montar'}
          </BotaoLink>
        )}
      </div>

      <ul className="lista cartao">
        <li>
          {podeEditar ? (
            <Link to={destino} className="toque">
              {conteudo}
            </Link>
          ) : (
            <div className="toque estatico">{conteudo}</div>
          )}
        </li>
      </ul>
    </div>
  )
}

export function Equipe({ escala, euId }: { escala: EscalaApresentada; euId: string }) {
  const grupos = equipePorGrupo(escala.pessoas)

  return (
    <div className="secao" data-guia="equipe">
      <h2>Equipe</h2>

      {escala.pessoas.length ? (
        <div className="cartao equipe-por-grupo">
          {grupos.map((grupo) => (
            <section key={grupo.chave} aria-label={grupo.nome}>
              <h3 className="nome-do-grupo">{grupo.nome}</h3>
              <ul className="lista">
                {grupo.pessoas.map((pessoa) => (
                  <li key={pessoa.membroId} className="pessoa">
                    <Rosto membroId={pessoa.membroId} nome={pessoa.nome} foto={pessoa.foto} tamanho="pequena" />
                    <span className="cresce nome-da-pessoa">
                      <span className="titulo">{pessoa.nome}</span>
                      {pessoa.ministro && <Selo variante="ministro">ministro</Selo>}
                      {pessoa.membroId === euId && <Selo variante="destaque">você</Selo>}
                    </span>
                    <span className="dica">{pessoa.funcoes.map((funcao) => funcao.toLowerCase()).join(', ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="dica">Ninguém escalado ainda.</p>
      )}
    </div>
  )
}

export function Repertorio({
  escala,
  dirige,
  podeEditar,
  acao,
  mudar,
  definir,
  hoje,
  visita,
  irAoUltimo = false,
}: {
  escala: EscalaApresentada
  dirige: boolean
  podeEditar: boolean
  acao: Acao
  mudar: Mudanca
  definir: (escala: EscalaApresentada) => void
  hoje: string
  visita: string | null
  irAoUltimo?: boolean
}) {
  const avisar = usarAviso()
  const pendente = usarRemocaoPendente()
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (irAoUltimo) lista.current?.lastElementChild?.scrollIntoView?.({ block: 'center' })
  }, [irAoUltimo])
  const [playlist, abrirPlaylist] = useState(false)
  const [itemAberto, abrirItem] = useState<string | null>(null)

  const itens = escala.itens
  const quantosMinistros = ministrosDaEscala(escala.pessoas).length
  const porDono = escala.anexosPorDono ?? {}
  const contagem = itens.length === 1 ? ' · 1 música' : itens.length ? ' · ' + itens.length + ' músicas' : ''

  const ordenacao = usarOrdenacao(itens.length, (de, para) => {
    const item = itens[de]
    definir({ ...escala, itens: mover(itens, de, para) })
    mudar(`/api/escalas/${escala.id}/itens/${item.id}`, { metodo: 'PATCH', corpo: { ordem: para } })
  })

  function remover(item: ItemApresentado) {
    const caminho = `/api/escalas/${escala.id}/itens/${item.id}`
    pendente.agendar(item.id, () => mudar(caminho, { metodo: 'DELETE' }))
    avisar('Música tirada da escala', { desfazer: () => pendente.desfazer(item.id) })
  }

  const aberto = itens.find((item) => item.id === itemAberto) ?? null

  return (
    <div className="secao" data-guia="repertorio">
      <div className="secao-topo">
        <h2>Repertório{contagem}</h2>
        {itens.length > 0 && (
          <Botao variante="terciario" pequeno icone="play" onClick={() => abrirPlaylist(true)}>
            Ouvir tudo
          </Botao>
        )}
      </div>

      {itens.length ? (
        <ul className="lista cartao" ref={lista}>
          {ordenacao.ordem.map((original, indice) => {
            const item = itens[original]

            // A linha de uma remoção pendente fica no DOM, escondida: a ordenação mede
            // as linhas por posição, e tirá-la do meio embaralharia as medidas.
            if (pendente.pendentes.includes(item.id)) return <li key={item.id} ref={ordenacao.linha(indice)} hidden />

            const puxa = textoDeQuemPuxa(item, quantosMinistros)

            return (
              <LinhaDoItem
                key={item.id}
                item={item}
                modo={podeEditar ? 'leitura' : 'navegacao'}
                numero={indice + 1}
                hoje={hoje}
                posicaoDoTom="direita"
                letraEm={
                  temLetraNoItem(item, porDono) ? `/escalas/${escala.id}/itens/${item.id}/letra` : undefined
                }
                ref={ordenacao.linha(indice)}
                arrastando={ordenacao.arrastando === indice}
                aoEscolher={podeEditar ? () => abrirItem(item.id) : undefined}
                selos={
                  <>
                    {!dirige && mudouDesdeAVisita(item.atualizadoEm, visita) && <Selo variante="atencao">mudou</Selo>}
                    {puxa && <span className="dica">{puxa}</span>}
                  </>
                }
                direita={podeEditar ? <Alca rotulo={tituloDoItem(item)} {...ordenacao.alca(indice)} /> : undefined}
              />
            )
          })}
        </ul>
      ) : (
        <p className="dica">Nenhuma música ainda.</p>
      )}

      {podeEditar && itens.length > 0 && (
        <p className="dica legenda">
          Toque numa música para mudar o tom, o trecho ou a observação. Arraste pela alça para reordenar.
        </p>
      )}

      {aberto && (
        <FolhaDoItem
          escala={escala}
          item={aberto}
          ocupado={acao.ocupado}
          anexos={porDono[aberto.tipo === 'medley' ? chaveDoItem(aberto.id) : aberto.musicaId] ?? []}
          recarregar={() => mudar(`/api/escalas/${escala.id}`, {})}
          fechar={() => abrirItem(null)}
          salvar={(corpo) =>
            mudar(`/api/escalas/${escala.id}/itens/${aberto.id}`, { metodo: 'PATCH', corpo }, 'Salvo')
          }
          remover={() => remover(aberto)}
        />
      )}

      {playlist && <FolhaDaPlaylist escalaId={escala.id} itens={itens} fechar={() => abrirPlaylist(false)} />}
    </div>
  )
}

function FolhaDaData({
  escala,
  ocupado,
  fechar,
  salvar,
}: {
  escala: EscalaApresentada
  ocupado: boolean
  fechar: () => void
  salvar: (corpo: { data: string; horario: string }) => void
}) {
  const [data, escreverData] = useState(escala.data)
  const [horario, escreverHorario] = useState(escala.horario)

  return (
    <Folha titulo="Editar data e horário" fechar={fechar}>
      <Campo rotulo="Data">
        <input type="date" value={data} onChange={(e) => escreverData(e.target.value)} />
      </Campo>

      <Campo rotulo="Horário">
        <input type="time" value={horario} onChange={(e) => escreverHorario(e.target.value)} />
      </Campo>

      {escala.estado === 'agendada' && <p className="dica">Quem está na Equipe recebe um aviso da nova data.</p>}

      <Botao largo disabled={ocupado} onClick={() => salvar({ data, horario })}>
        Salvar
      </Botao>
    </Folha>
  )
}
