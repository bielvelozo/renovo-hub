import { useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../api/cliente'
import type { Opcoes } from '../api/cliente'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Alca } from '../componentes/Alca'
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Menu } from '../componentes/Menu'
import { Selos } from '../componentes/Selos'
import { usarOrdenacao } from '../componentes/usarOrdenacao'
import { usarRemocaoPendente } from '../componentes/usarRemocaoPendente'
import { formatarDia } from '../dominio'
import { tituloDoItem } from '../escalas/repertorio'
import { usarEu } from '../sessao/sessao'
import { VistoEm } from '../componentes/VistoEm'

type Aberta = 'editar' | 'cancelar' | 'whatsapp' | 'playlist' | null

type Mudanca = (caminho: string, opcoes: Opcoes) => void

export function Escala() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const busca = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const acao = usarAcao()
  const [aberta, abrir] = useState<Aberta>(null)

  const escala = busca.dados

  const mudar: Mudanca = (caminho, opcoes) => {
    acao.executar(async () => {
      busca.definir(await api<EscalaApresentada>(caminho, opcoes))
    })
  }

  const cabecalho = (
    <>
      <Cabecalho
        titulo={escala?.titulo ?? 'Escala'}
        sub={
          escala && (
            <>
              {formatarDia(escala.data)} <Selos estado={escala.estado} santaCeia={escala.santaCeia} />
            </>
          )
        }
        voltarPara="/mes"
        acao={
          escala && dirige ? (
            <Menu
              rotulo="Mais"
              itens={[
                { rotulo: 'Editar data, horário e Santa Ceia', icone: 'calendario', aoEscolher: () => abrir('editar') },
                ...(escala.estado !== 'cancelada'
                  ? [{ rotulo: 'Marcar como Cancelada', icone: 'remover' as const, perigo: true, aoEscolher: () => abrir('cancelar') }]
                  : []),
              ]}
            />
          ) : undefined
        }
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

  return (
    <section className="pagina">
      {cabecalho}

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {escala.estado === 'cancelada' && (
        <div className="aviso pagina">
          <p>Escala Cancelada: não gera Execução nem conta presença de ninguém.</p>
          {dirige && (
            <Botao
              variante="secundario"
              pequeno
              disabled={acao.ocupado}
              onClick={() => mudar(`/api/escalas/${id}/desfazer`, { metodo: 'POST' })}
            >
              Desfazer o cancelamento
            </Botao>
          )}
        </div>
      )}

      {escala.estado === 'realizada' && <p className="dica">Editar aqui não avisa ninguém.</p>}

      <div className="secao">
        <div className="secao-topo">
          <h2>Equipe</h2>
          {dirige && (
            <BotaoLink para={`/escalas/${id}/equipe`} variante="secundario" pequeno>
              {escala.equipe.length ? 'Editar' : 'Montar'}
            </BotaoLink>
          )}
        </div>

        {escala.grupos.length ? (
          <div className="cartao pagina">
            {escala.grupos.map((grupo) => (
              <div key={grupo.nome} className="grupo">
                <span className="rotulo">{grupo.nome}</span>
                <span>{grupo.itens.join(', ')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dica">Ninguém escalado ainda.</p>
        )}
      </div>

      <div className="secao">
        <h2>Repertório</h2>

        {escala.itens.length ? (
          <Repertorio
            itens={escala.itens}
            podeEditar={dirige && escala.estado !== 'cancelada'}
            acao={acao}
            mudar={mudar}
            escalaId={id}
          />
        ) : (
          <p className="dica">Nenhuma música ainda.</p>
        )}

        {dirige && escala.estado !== 'cancelada' && (
          <div className="chips">
            <BotaoLink para={`/escalas/${id}/adicionar`} pequeno>
              + Música
            </BotaoLink>
            <BotaoLink para={`/escalas/${id}/medley`} variante="secundario" pequeno>
              + Medley
            </BotaoLink>
          </div>
        )}
      </div>

      <div className="secao pagina">
        <Botao variante="secundario" largo onClick={() => abrir('whatsapp')}>
          Texto pro WhatsApp
        </Botao>
        <Botao variante="secundario" largo onClick={() => abrir('playlist')}>
          Playlist pra ouvir
        </Botao>
      </div>

      {aberta === 'editar' && (
        <FolhaDeEdicao
          escala={escala}
          ocupado={acao.ocupado}
          fechar={() => abrir(null)}
          salvar={(corpo) => {
            mudar(`/api/escalas/${id}`, { metodo: 'PATCH', corpo })
            abrir(null)
          }}
        />
      )}

      {aberta === 'cancelar' && (
        <Folha titulo={`Não vai ter culto dia ${formatarDia(escala.data)}?`} fechar={() => abrir(null)}>
          <p className="dica">Dá pra desfazer depois.</p>
          <Botao
            variante="perigo"
            largo
            disabled={acao.ocupado}
            onClick={() => {
              mudar(`/api/escalas/${id}/cancelar`, { metodo: 'POST' })
              abrir(null)
            }}
          >
            Sim, cancelar
          </Botao>
        </Folha>
      )}

      {aberta === 'whatsapp' && <FolhaDoWhatsapp escalaId={id} fechar={() => abrir(null)} />}
      {aberta === 'playlist' && <FolhaDaPlaylist escalaId={id} itens={escala.itens} fechar={() => abrir(null)} />}
    </section>
  )
}

function Repertorio({
  itens,
  podeEditar,
  acao,
  mudar,
  escalaId,
}: {
  itens: ItemApresentado[]
  podeEditar: boolean
  acao: Acao
  mudar: Mudanca
  escalaId: string
}) {
  const avisar = usarAviso()
  const pendente = usarRemocaoPendente()

  const ordenacao = usarOrdenacao(itens.length, (de, para) =>
    mudar(`/api/escalas/${escalaId}/itens/${itens[de].id}`, { metodo: 'PATCH', corpo: { ordem: para } }),
  )

  function remover(item: ItemApresentado) {
    const caminho = `/api/escalas/${escalaId}/itens/${item.id}`
    pendente.agendar(item.id, () => mudar(caminho, { metodo: 'DELETE' }))
    avisar('Música tirada da Escala', { desfazer: () => pendente.desfazer(item.id) })
  }

  return (
    <ul className="lista cartao">
      {ordenacao.ordem.map((original, indice) => {
        const item = itens[original]
        if (pendente.pendentes.includes(item.id)) return null

        const titulo = tituloDoItem(item)

        return (
          <LinhaDoItem
            key={item.id}
            item={item}
            modo="leitura"
            numero={indice + 1}
            ref={ordenacao.linha(indice)}
            arrastando={ordenacao.arrastando === indice}
            direita={
              podeEditar ? (
                <>
                  <Alca rotulo={titulo} {...ordenacao.alca(indice)} />
                  <Botao
                    variante="icone"
                    icone="remover"
                    aria-label={`Remover ${titulo}`}
                    disabled={acao.ocupado}
                    onClick={() => remover(item)}
                  />
                </>
              ) : undefined
            }
          />
        )
      })}
    </ul>
  )
}

function FolhaDeEdicao({
  escala,
  ocupado,
  fechar,
  salvar,
}: {
  escala: EscalaApresentada
  ocupado: boolean
  fechar: () => void
  salvar: (corpo: { data: string; horario: string; santaCeia: boolean }) => void
}) {
  const [data, escreverData] = useState(escala.data)
  const [horario, escreverHorario] = useState(escala.horario)
  const [santaCeia, marcarCeia] = useState(escala.santaCeia)

  return (
    <Folha titulo="Editar Escala" fechar={fechar}>
      <Campo rotulo="Data">
        <input type="date" value={data} onChange={(e) => escreverData(e.target.value)} />
      </Campo>

      <Campo rotulo="Horário">
        <input type="time" value={horario} onChange={(e) => escreverHorario(e.target.value)} />
      </Campo>

      <div className="campo">
        <span className="rotulo">Tipo</span>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={santaCeia} onClick={() => marcarCeia((antes) => !antes)}>
            Santa Ceia
          </button>
        </div>
      </div>

      <Botao largo disabled={ocupado} onClick={() => salvar({ data, horario, santaCeia })}>
        Salvar
      </Botao>
    </Folha>
  )
}
