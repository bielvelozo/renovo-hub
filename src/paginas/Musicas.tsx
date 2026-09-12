import { useState } from 'react'
import type { MusicaNaLista } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Busca } from '../componentes/Busca'
import { Esqueleto } from '../componentes/Esqueleto'
import { LinhaDeMusica } from '../componentes/LinhaDeMusica'
import { Vazio } from '../componentes/Vazio'
import { combinaBusca } from '../dominio'
import type { OrdemDoCatalogo } from '../dominio'
import type { FiltroDoCatalogo } from '../musicas/catalogo'
import { FILTROS, ORDENS, caminhoDoCatalogo, textoDoVazio } from '../musicas/catalogo'
import { VistoEm } from '../componentes/VistoEm'

export function Musicas() {
  const [filtro, filtrar] = useState<FiltroDoCatalogo>('todas')
  const [ordem, ordenar] = useState<OrdemDoCatalogo>('mais-tempo')
  const [termo, escreverTermo] = useState('')
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>(caminhoDoCatalogo(filtro, ordem))

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <Cabecalho raiz titulo="Músicas" />
      <VistoEm hora={catalogo.vistoEm} />

      <Busca valor={termo} aoMudar={escreverTermo} />

      <div className="chips" role="group" aria-label="Ordem">
        {ORDENS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className="chip"
            aria-pressed={opcao.valor === ordem}
            onClick={() => ordenar(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div className="chips" role="group" aria-label="Filtros">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className="chip"
            aria-pressed={opcao.valor === filtro}
            onClick={() => filtrar(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <Esqueleto forma="linha-de-musica" quantidade={5} />}

      {catalogo.dados && achadas.length === 0 && (
        <Vazio icone="musica">
          {termo.trim() ? 'Nenhuma música com esse nome. Cole um link ou busque no YouTube.' : textoDoVazio(filtro, termo)}
        </Vazio>
      )}

      {achadas.length > 0 && (
        <ul className="lista cartao">
          {achadas.map((musica) => (
            <LinhaDeMusica
              key={musica.id}
              musica={musica}
              modo="navegacao"
            />
          ))}
        </ul>
      )}
    </section>
  )
}
