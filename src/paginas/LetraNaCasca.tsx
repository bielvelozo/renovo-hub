import { useParams } from 'react-router'
import type { MusicaDetalhada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Esqueleto } from '../componentes/Esqueleto'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { BarraDeLeitura } from '../letra/BarraDeLeitura'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { nomeExibido } from './Musica'

export function LetraNaCasca() {
  const { id = '' } = useParams()
  const busca = usarBusca<MusicaDetalhada>(`/api/musicas/${id}`)
  const musica = busca.dados
  const nome = musica ? nomeExibido(musica) : null

  const cabecalho = <Cabecalho titulo={nome?.titulo ?? 'Letra'} sub={nome?.artista} voltarPara={`/musicas/${id}`} />

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{busca.erro}</p>
      </section>
    )
  }

  if (!musica || !nome) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="paragrafo" />
      </section>
    )
  }

  return (
    <section className="pagina">
      {cabecalho}

      {musica.tomSugerido && (
        <div className="selos">
          <Selo variante="tom">
            Tom {musica.tomSugerido.tom}
            {musica.tomSugerido.origem === 'original' ? ' · original' : ''}
          </Selo>
        </div>
      )}

      {musica.letra && <BarraDeLeitura />}

      {musica.letra ? <CorpoDaLetra letra={musica.letra} /> : <Vazio icone="documento">Sem letra ainda</Vazio>}
    </section>
  )
}
