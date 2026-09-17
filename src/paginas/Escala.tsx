import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
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
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Cartao } from '../componentes/Cartao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { FolhaDoItem } from '../componentes/FolhaDoItem'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Menu } from '../componentes/Menu'
import type { ItemDoMenu } from '../componentes/Menu'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Selo } from '../componentes/Selo'
import { mover } from '../componentes/ordenacao'
import { usarOrdenacao } from '../componentes/usarOrdenacao'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { VistoEm } from '../componentes/VistoEm'
import { formatarDia, hojeEmBrasilia, nomeDaEscala, rotuloDoHorario } from '../dominio'
import {
  ministrosDaEscala,
  selosDaMemoria,
  selosDeEstado,
  textoDeQuemPuxa,
  textoDoResumoDoRepertorio,
  tituloDoItem,
} from '../escalas/repertorio'
import { marcarVisitaNaEscala, mudouDesdeAVisita, visitaNaEscala } from '../escalas/visita'
import { inicialDoNome } from '../perfil/perfil'
import { usarEu } from '../sessao/sessao'

type Aberta = 'editar' | 'cancelar' | 'whatsapp' | null

type Mudanca = (caminho: string, opcoes: Opcoes, aviso?: string) => void

const MAXIMO_DE_PESSOAS = 6

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

  const escala = busca.dados

  // A marca «mudou» compara com a visita anterior, então a desta abertura só é
  // gravada depois de a tela renderizar com os selos.
  useEffect(() => {
    if (escala) marcarVisitaNaEscala(id)
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
        sub={escala && formatarDia(escala.data, hoje) + ' · ' + rotuloDoHorario(escala.horario)}
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
        <p className="aviso">{busca.erro}</p>
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

  const selos = selosDeEstado(escala, dirige)
  const podeEditar = dirige && escala.estado !== 'cancelada'

  return (
    <section className="pagina">
      {cabecalho}

      {selos.length > 0 && (
        <span className="selos faixa-de-estado">
          {selos.map((selo) => (
            <Selo key={selo.chave} variante={selo.variante}>
              {selo.texto}
            </Selo>
          ))}
        </span>
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

      <Equipe escala={escala} euId={eu.id} dirige={dirige} />

      <Repertorio
        escala={escala}
        dirige={dirige}
        podeEditar={podeEditar}
        acao={acao}
        mudar={mudar}
        definir={busca.definir}
        hoje={hoje}
        visita={visita}
      />

      {podeEditar && (
        <RodapeDeAcao
          primario={
            <BotaoLink para={`/escalas/${id}/adicionar`} largo>
              Adicionar música
            </BotaoLink>
          }
          secundario={
            <Botao variante="secundario" icone="whatsapp" onClick={() => abrir('whatsapp')}>
              WhatsApp
            </Botao>
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

export function Equipe({ escala, euId, dirige }: { escala: EscalaApresentada; euId: string; dirige: boolean }) {
  const [tudo, mostrarTudo] = useState(false)
  const pessoas = tudo ? escala.pessoas : escala.pessoas.slice(0, MAXIMO_DE_PESSOAS)
  const escondidas = escala.pessoas.length - pessoas.length

  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>Equipe</h2>
        {dirige && (
          <BotaoLink para={`/escalas/${escala.id}/equipe`} variante="secundario" pequeno>
            {escala.pessoas.length ? 'Editar' : 'Montar'}
          </BotaoLink>
        )}
      </div>

      {escala.pessoas.length ? (
        <ul className="lista cartao">
          {pessoas.map((pessoa) => (
            <li key={pessoa.membroId} className="pessoa">
              <span className="inicial pequena" aria-hidden="true">
                {inicialDoNome(pessoa.nome)}
              </span>
              <span className="cresce titulo">{pessoa.nome}</span>
              <span className="selos">
                {pessoa.membroId === euId && <Selo variante="destaque">você</Selo>}
                {pessoa.ministro && <Selo variante="ministro">ministro</Selo>}
                {pessoa.funcoes.map((funcao) => (
                  <Selo key={funcao}>{funcao.toLowerCase()}</Selo>
                ))}
              </span>
            </li>
          ))}

          {escondidas > 0 && (
            <li>
              <Botao variante="terciario" pequeno onClick={() => mostrarTudo(true)}>
                e mais {escondidas} <Icone nome="seta" />
              </Botao>
            </li>
          )}
        </ul>
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
}: {
  escala: EscalaApresentada
  dirige: boolean
  podeEditar: boolean
  acao: Acao
  mudar: Mudanca
  definir: (escala: EscalaApresentada) => void
  hoje: string
  visita: string | null
}) {
  const avisar = usarAviso()
  const pendente = usarRemocaoPendente()
  const [playlist, abrirPlaylist] = useState(false)
  const [itemAberto, abrirItem] = useState<string | null>(null)

  const itens = escala.itens
  const quantosMinistros = ministrosDaEscala(escala.pessoas).length
  const porDono = escala.anexosPorDono ?? {}
  const resumo = textoDoResumoDoRepertorio(escala.resumoDoRepertorio)
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
    <div className="secao">
      <div className="secao-topo">
        <h2>Repertório{contagem}</h2>
        {itens.length > 0 && (
          <Botao variante="terciario" pequeno icone="play" onClick={() => abrirPlaylist(true)}>
            Ouvir tudo
          </Botao>
        )}
      </div>

      {itens.length ? (
        <ul className="lista cartao">
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
                letraEm={
                  temLetraNoItem(item, porDono) ? `/escalas/${escala.id}/itens/${item.id}/letra` : undefined
                }
                ref={ordenacao.linha(indice)}
                arrastando={ordenacao.arrastando === indice}
                aoEscolher={podeEditar ? () => abrirItem(item.id) : undefined}
                selos={
                  <>
                    {selosDaMemoria(item.memoria, hoje).map((selo) => (
                      <Selo key={selo.chave} variante="atencao">
                        {selo.texto}
                      </Selo>
                    ))}
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

      {resumo && <p className="dica">{resumo}</p>}

      {aberto && (
        <FolhaDoItem
          escala={escala}
          item={aberto}
          ocupado={acao.ocupado}
          hoje={hoje}
          anexos={porDono[chaveDoItem(aberto.id)] ?? []}
          recarregar={() => mudar(`/api/escalas/${escala.id}`, {})}
          fechar={() => abrirItem(null)}
          salvar={(corpo) =>
            mudar(`/api/escalas/${escala.id}/itens/${aberto.id}`, { metodo: 'PATCH', corpo }, 'Item salvo')
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

      <Botao largo disabled={ocupado} onClick={() => salvar({ data, horario })}>
        Salvar
      </Botao>
    </Folha>
  )
}
