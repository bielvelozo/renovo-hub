import { useState } from 'react'
import { Link } from 'react-router'
import type { Anexo, EscalaApresentada, EscalaResumida, ItemApresentado } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Capa } from '../componentes/Capa'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { Selos } from '../componentes/Selos'
import type { Funcao } from '../dominio'
import { formatarDia, musicasDoItem } from '../dominio'
import { capasDoItem, resumoDoItem, tituloDoItem } from '../escalas/repertorio'
import { anexosPorMusica, minhaEntrada, proximaEscala, textoDaMinhaFuncao, textoDeQuemMinistra } from '../inicio/proxima'
import { usarEu } from '../sessao/sessao'

type Aberta = 'whatsapp' | 'playlist' | null

export function Inicio() {
  const eu = usarEu()
  const lista = usarBusca<{ escalas: EscalaResumida[] }>('/api/escalas')

  if (lista.erro) return <p className="aviso">{lista.erro}</p>
  if (!lista.dados) return <div className="girando" role="status" aria-label="Carregando" />

  const proxima = proximaEscala(lista.dados.escalas, eu.id)

  return (
    <section className="pagina">
      <h1>Oi, {eu.nome}</h1>

      {proxima ? (
        <ProximaEscala id={proxima.escala.id} minha={proxima.minha} />
      ) : (
        <div className="cartao">
          <p className="dica">Nenhuma Escala Agendada por enquanto. Quando o mês for criado, ela aparece aqui.</p>
        </div>
      )}
    </section>
  )
}

function ProximaEscala({ id, minha }: { id: string; minha: boolean }) {
  const eu = usarEu()
  const busca = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const funcoes = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const anexos = usarBusca<{ anexos: Anexo[] }>(`/api/escalas/${id}/anexos`)
  const [aberta, abrir] = useState<Aberta>(null)

  const escala = busca.dados

  if (busca.erro) return <p className="aviso">{busca.erro}</p>
  if (!escala) return <div className="girando" role="status" aria-label="Carregando" />

  const entrada = minhaEntrada(escala.equipe, eu.id)
  const ministra = textoDeQuemMinistra(escala.grupos)
  const porMusica = anexosPorMusica(anexos.dados?.anexos ?? [])

  return (
    <>
      <div className="cartao pagina">
        <div className="secao-topo">
          <div className="cresce">
            <div className="titulo">{escala.titulo}</div>
            <div className="dica">
              {formatarDia(escala.data)} <Selos estado={escala.estado} santaCeia={escala.santaCeia} />
            </div>
          </div>
          <Link to={`/escalas/${id}`} className="botao secundario pequeno">
            Abrir
          </Link>
        </div>

        <div className="grupo">
          <span className="rotulo">Você</span>
          <span>
            {entrada ? textoDaMinhaFuncao(entrada, funcoes.dados?.funcoes ?? []) : 'não está nesta Escala'}
          </span>
        </div>

        <div className="grupo">
          <span className="rotulo">{ministra && ministra.includes(',') ? 'Ministros' : 'Ministro'}</span>
          <span>{ministra ?? 'ainda não marcado'}</span>
        </div>

        {!minha && <p className="dica">Você não está escalado. Esta é a próxima Escala do ministério.</p>}
      </div>

      <div className="secao">
        <h2>Repertório</h2>

        {escala.itens.length ? (
          <ul className="lista cartao">
            {escala.itens.map((item, indice) => (
              <ItemDoMembro key={item.id} item={item} indice={indice} anexos={porMusica} />
            ))}
          </ul>
        ) : (
          <p className="dica">O Ministro ainda não escolheu as músicas.</p>
        )}
      </div>

      <div className="secao pagina">
        <button type="button" className="botao secundario largo" onClick={() => abrir('playlist')}>
          Playlist pra ouvir
        </button>
        <button type="button" className="botao secundario largo" onClick={() => abrir('whatsapp')}>
          Texto pro WhatsApp
        </button>
      </div>

      {aberta === 'whatsapp' && <FolhaDoWhatsapp escalaId={id} fechar={() => abrir(null)} />}
      {aberta === 'playlist' && <FolhaDaPlaylist escalaId={id} itens={escala.itens} fechar={() => abrir(null)} />}
    </>
  )
}

function ItemDoMembro({
  item,
  indice,
  anexos,
}: {
  item: ItemApresentado
  indice: number
  anexos: Record<string, Anexo[]>
}) {
  const daMusica = musicasDoItem(item).flatMap((musicaId) => anexos[musicaId] ?? [])

  return (
    <li className="item-do-membro">
      <div className="item">
        <Capa musicas={capasDoItem(item)} />
        <div className="cresce">
          <div className="titulo">
            {indice + 1}. {tituloDoItem(item)}
          </div>
          <div className="dica">
            {item.tipo === 'trecho' && <span className="selo parcial">trecho</span>} {resumoDoItem(item)}
          </div>
        </div>
      </div>

      {item.observacao && <div className="observacao">{item.observacao}</div>}

      {item.tipo === 'medley' ? (
        <ol className="encadeado">
          {item.trechos.map((trecho, posicao) => (
            <li key={`${trecho.musicaId}-${posicao}`}>
              <a href={trecho.link} target="_blank" rel="noopener">
                {trecho.musica.titulo}
              </a>
              <span className="dica">
                {' '}
                {trecho.inicio}–{trecho.fim} · Tom {trecho.tom}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <a className="dica" href={item.link} target="_blank" rel="noopener">
          Abrir no YouTube{item.tipo === 'trecho' ? ` em ${item.inicio}` : ''}
        </a>
      )}

      {daMusica.map((anexo) => (
        <a key={anexo.id} className="dica" href={anexo.url}>
          Sequência: {anexo.nome} (v{anexo.versao})
        </a>
      ))}
    </li>
  )
}
