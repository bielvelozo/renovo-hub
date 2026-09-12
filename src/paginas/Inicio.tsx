import { useState } from 'react'
import type { Anexo, EscalaApresentada, EscalaResumida } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { Esqueleto } from '../componentes/Esqueleto'
import { FolhaDaPlaylist, FolhaDoWhatsapp } from '../componentes/FolhasDaEscala'
import { LinhaDoItem } from '../componentes/LinhaDeMusica'
import { Selos } from '../componentes/Selos'
import { Vazio } from '../componentes/Vazio'
import type { Funcao } from '../dominio'
import { formatarDia, musicasDoItem } from '../dominio'
import { anexosPorMusica, minhaEntrada, proximaEscala, textoDaMinhaFuncao, textoDeQuemMinistra } from '../inicio/proxima'
import { usarEu } from '../sessao/sessao'

type Aberta = 'whatsapp' | 'playlist' | null

export function Inicio() {
  const eu = usarEu()
  const lista = usarBusca<{ escalas: EscalaResumida[] }>('/api/escalas')

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

  if (lista.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{lista.erro}</p>
      </section>
    )
  }

  if (!lista.dados) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="cartao" />
      </section>
    )
  }

  const proxima = proximaEscala(lista.dados.escalas, eu.id)

  return (
    <section className="pagina">
      {cabecalho}

      {proxima ? (
        <ProximaEscala id={proxima.escala.id} minha={proxima.minha} />
      ) : (
        <Vazio icone="calendario">Nenhuma Escala Agendada por enquanto. Quando o mês for criado, ela aparece aqui.</Vazio>
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
  if (!escala) return <Esqueleto forma="cartao" />

  const entrada = minhaEntrada(escala.equipe, eu.id)
  const ministra = textoDeQuemMinistra(escala.grupos)
  const porMusica = anexosPorMusica(anexos.dados?.anexos ?? [])

  return (
    <>
      <Cartao destaque className="pagina">
        <div className="secao-topo">
          <div className="cresce">
            <div className="titulo">{escala.titulo}</div>
            <div className="dica">
              {formatarDia(escala.data)} <Selos estado={escala.estado} santaCeia={escala.santaCeia} />
            </div>
          </div>
          <BotaoLink para={`/escalas/${id}`} variante="secundario" pequeno>
            Abrir
          </BotaoLink>
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
      </Cartao>

      <div className="secao">
        <h2>Repertório</h2>

        {escala.itens.length ? (
          <ul className="lista cartao">
            {escala.itens.map((item, indice) => (
              <LinhaDoItem
                key={item.id}
                item={item}
                modo="leitura"
                numero={indice + 1}
                anexos={musicasDoItem(item).flatMap((musicaId) => porMusica[musicaId] ?? [])}
              />
            ))}
          </ul>
        ) : (
          <p className="dica">O Ministro ainda não escolheu as músicas.</p>
        )}
      </div>

      <div className="secao pagina">
        <Botao variante="secundario" largo onClick={() => abrir('playlist')}>
          Playlist pra ouvir
        </Botao>
        <Botao variante="secundario" largo onClick={() => abrir('whatsapp')}>
          Texto pro WhatsApp
        </Botao>
      </div>

      {aberta === 'whatsapp' && <FolhaDoWhatsapp escalaId={id} fechar={() => abrir(null)} />}
      {aberta === 'playlist' && <FolhaDaPlaylist escalaId={id} itens={escala.itens} fechar={() => abrir(null)} />}
    </>
  )
}
