import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api/cliente'
import type { Opcoes } from '../api/cliente'
import type { EscalaApresentada, ItemApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Barra } from '../componentes/Barra'
import { Capa } from '../componentes/Capa'
import { Folha } from '../componentes/Folha'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { Selos } from '../componentes/Selos'
import { rotuloDoDia } from '../escalas/mes'
import { capasDoItem, podeDescer, podeSubir, resumoDoItem, tituloDoItem } from '../escalas/repertorio'
import { usarEu } from '../sessao/sessao'

type Aberta = 'menu' | 'editar' | 'cancelar' | 'whatsapp' | 'playlist' | null

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

  if (busca.erro) return <p className="aviso">{busca.erro}</p>
  if (!escala) return <div className="girando" role="status" aria-label="Carregando" />

  return (
    <section className="pagina">
      <Barra
        titulo={escala.titulo}
        sub={
          <>
            {rotuloDoDia(escala.data)} <Selos estado={escala.estado} santaCeia={escala.santaCeia} />
          </>
        }
        voltarPara="/mes"
        acao={
          dirige ? (
            <button type="button" className="botao secundario icone" aria-label="Mais" onClick={() => abrir('menu')}>
              ⋯
            </button>
          ) : null
        }
      />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {escala.estado === 'cancelada' && (
        <div className="aviso pagina">
          <p>Escala Cancelada: não gera Execução nem conta presença de ninguém.</p>
          {dirige && (
            <button
              type="button"
              className="botao secundario pequeno"
              disabled={acao.ocupado}
              onClick={() => mudar(`/api/escalas/${id}/desfazer`, { metodo: 'POST' })}
            >
              Desfazer o cancelamento
            </button>
          )}
        </div>
      )}

      {escala.estado === 'realizada' && (
        <p className="dica">Realizada. Editar aqui corrige o histórico e não avisa ninguém.</p>
      )}

      <div className="secao">
        <div className="secao-topo">
          <h2>Equipe</h2>
          {dirige && (
            <Link to={`/escalas/${id}/equipe`} className="botao secundario pequeno">
              {escala.equipe.length ? 'Editar' : 'Montar'}
            </Link>
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
          <ul className="lista cartao">
            {escala.itens.map((item, indice) => (
              <ItemDoRepertorio
                key={item.id}
                item={item}
                indice={indice}
                total={escala.itens.length}
                podeEditar={dirige && escala.estado !== 'cancelada'}
                acao={acao}
                mudar={mudar}
                escalaId={id}
              />
            ))}
          </ul>
        ) : (
          <p className="dica">Nenhuma música ainda.</p>
        )}

        {dirige && escala.estado !== 'cancelada' && (
          <div className="chips">
            <Link to={`/escalas/${id}/adicionar`} className="botao pequeno">
              + Música
            </Link>
            <Link to={`/escalas/${id}/medley`} className="botao secundario pequeno">
              + Medley
            </Link>
          </div>
        )}
      </div>

      <div className="secao pagina">
        <button type="button" className="botao secundario largo" onClick={() => abrir('whatsapp')}>
          Texto pro WhatsApp
        </button>
        <button type="button" className="botao secundario largo" onClick={() => abrir('playlist')}>
          Playlist pra ouvir
        </button>
      </div>

      {aberta === 'menu' && (
        <Folha titulo={`${escala.titulo} · ${rotuloDoDia(escala.data)}`} fechar={() => abrir(null)}>
          <button type="button" className="botao secundario largo" onClick={() => abrir('editar')}>
            Editar data, horário e Santa Ceia
          </button>
          {escala.estado !== 'cancelada' && (
            <button type="button" className="botao perigo largo" onClick={() => abrir('cancelar')}>
              Marcar como Cancelada
            </button>
          )}
        </Folha>
      )}

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
        <Folha titulo={`Não vai ter culto dia ${rotuloDoDia(escala.data)}?`} fechar={() => abrir(null)}>
          <p className="dica">
            A Escala fica Cancelada: nada dela vira Execução e ninguém perde presença. Dá pra desfazer depois.
          </p>
          <button
            type="button"
            className="botao perigo largo"
            disabled={acao.ocupado}
            onClick={() => {
              mudar(`/api/escalas/${id}/cancelar`, { metodo: 'POST' })
              abrir(null)
            }}
          >
            Sim, cancelar
          </button>
        </Folha>
      )}

      {aberta === 'whatsapp' && <FolhaDoWhatsapp escalaId={id} fechar={() => abrir(null)} />}
      {aberta === 'playlist' && <FolhaDaPlaylist escalaId={id} fechar={() => abrir(null)} />}
    </section>
  )
}

function ItemDoRepertorio({
  item,
  indice,
  total,
  podeEditar,
  acao,
  mudar,
  escalaId,
}: {
  item: ItemApresentado
  indice: number
  total: number
  podeEditar: boolean
  acao: Acao
  mudar: Mudanca
  escalaId: string
}) {
  const caminho = `/api/escalas/${escalaId}/itens/${item.id}`
  const titulo = tituloDoItem(item)

  return (
    <li className="item">
      <Capa musicas={capasDoItem(item)} />

      <div className="cresce">
        <div className="titulo">
          {indice + 1}. {titulo}
        </div>
        <div className="dica">
          {item.tipo === 'trecho' && <span className="selo parcial">trecho</span>} {resumoDoItem(item)}
        </div>
        {item.observacao && <div className="observacao">{item.observacao}</div>}
      </div>

      {podeEditar && (
        <div className="acoes">
          <button
            type="button"
            className="botao secundario icone"
            aria-label={`Subir ${titulo}`}
            disabled={acao.ocupado || !podeSubir(indice)}
            onClick={() => mudar(caminho, { metodo: 'PATCH', corpo: { ordem: indice - 1 } })}
          >
            ↑
          </button>
          <button
            type="button"
            className="botao secundario icone"
            aria-label={`Descer ${titulo}`}
            disabled={acao.ocupado || !podeDescer(indice, total)}
            onClick={() => mudar(caminho, { metodo: 'PATCH', corpo: { ordem: indice + 1 } })}
          >
            ↓
          </button>
          <button
            type="button"
            className="botao secundario icone"
            aria-label={`Remover ${titulo}`}
            disabled={acao.ocupado}
            onClick={() => mudar(caminho, { metodo: 'DELETE' })}
          >
            ×
          </button>
        </div>
      )}
    </li>
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
      <label className="campo">
        <span className="rotulo">Data</span>
        <input type="date" value={data} onChange={(e) => escreverData(e.target.value)} />
      </label>

      <label className="campo">
        <span className="rotulo">Horário</span>
        <input type="time" value={horario} onChange={(e) => escreverHorario(e.target.value)} />
      </label>

      <div className="campo">
        <span className="rotulo">Tipo</span>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={santaCeia} onClick={() => marcarCeia((antes) => !antes)}>
            Santa Ceia
          </button>
        </div>
      </div>

      <button
        type="button"
        className="botao largo"
        disabled={ocupado}
        onClick={() => salvar({ data, horario, santaCeia })}
      >
        Salvar
      </button>
    </Folha>
  )
}
