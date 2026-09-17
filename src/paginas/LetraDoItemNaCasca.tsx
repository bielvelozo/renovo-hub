import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaApresentada, ItemApresentado, MusicaDetalhada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Esqueleto } from '../componentes/Esqueleto'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { TOM_ORIGINAL } from '../dominio'
import type { Letra } from '../dominio'
import { tituloDoItem } from '../escalas/repertorio'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { juntarLetras } from '../letra/letra'

export function LetraDoItemNaCasca() {
  const { id = '', itemId = '' } = useParams()
  const busca = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const item = busca.dados?.itens.find((candidato) => candidato.id === itemId) ?? null
  const letra = usarLetraDoItem(item)

  const cabecalho = (
    <Cabecalho
      titulo={item ? tituloDoItem(item) : 'Letra'}
      sub={item && item.tipo !== 'medley' ? item.musica.artista : undefined}
      voltarPara={`/escalas/${id}`}
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
        <Esqueleto forma="paragrafo" />
      </section>
    )
  }

  if (!item) {
    return (
      <section className="pagina">
        {cabecalho}
        <Vazio icone="musica">Essa música não está mais no repertório</Vazio>
      </section>
    )
  }

  return (
    <section className="pagina">
      {cabecalho}

      {item.tipo === 'medley' ? (
        item.trechos.map((trecho, posicao) => (
          <p key={`${trecho.musicaId}-${posicao}`} className="trecho-do-culto">
            <span className="cresce">
              <span className="titulo">{trecho.musica.titulo}</span>
              <span className="dica">
                {trecho.inicio}–{trecho.fim}
              </span>
            </span>
            <Selo variante="tom">{rotuloDoTom(trecho.tom)}</Selo>
          </p>
        ))
      ) : (
        <div className="selos">
          <Selo variante="tom">{rotuloDoTom(item.tom)}</Selo>
          {item.tipo === 'trecho' && (
            <Selo variante="trecho">
              trecho {item.inicio}–{item.fim}
            </Selo>
          )}
        </div>
      )}

      {item.observacao && <p className="observacao-do-culto">{item.observacao}</p>}

      {letra.carregando ? (
        <Esqueleto forma="paragrafo" />
      ) : letra.dados ? (
        <CorpoDaLetra letra={letra.dados} />
      ) : (
        <Vazio icone="documento">Sem letra ainda</Vazio>
      )}
    </section>
  )
}

function usarLetraDoItem(item: ItemApresentado | null) {
  const [dados, guardar] = useState<Letra | null>(null)
  const [carregando, marcar] = useState(true)

  useEffect(() => {
    if (!item) return

    let vivo = true
    marcar(true)

    buscarLetra(item)
      .catch(() => null)
      .then((achada) => {
        if (!vivo) return
        guardar(achada)
        marcar(false)
      })

    return () => {
      vivo = false
    }
  }, [item?.id, item?.tipo])

  return { dados, carregando }
}

async function buscarLetra(item: ItemApresentado): Promise<Letra | null> {
  if (item.tipo !== 'medley') return (await api<MusicaDetalhada>(`/api/musicas/${item.musicaId}`)).letra

  const doItem = (await api<{ letra: Letra | null }>(`/api/itens/${item.id}/letra`)).letra
  if (doItem) return doItem

  const musicas = await Promise.all(
    item.trechos.map((trecho) => api<MusicaDetalhada>(`/api/musicas/${trecho.musicaId}`)),
  )

  return juntarLetras(
    musicas.map((musica, posicao) => ({ titulo: item.trechos[posicao].musica.titulo, letra: musica.letra })),
  )
}

function rotuloDoTom(tom: string): string {
  return tom === TOM_ORIGINAL ? 'tom original' : `Tom ${tom}`
}
