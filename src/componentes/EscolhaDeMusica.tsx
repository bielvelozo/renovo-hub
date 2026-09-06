import { useState } from 'react'
import { api } from '../api/cliente'
import type { MusicaNaLista, Resolucao } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { combinaBusca } from '../dominio'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaMusica, escolhaDoLink } from '../escalas/rascunho'
import { Barra } from './Barra'
import { Capa } from './Capa'
import { SelosDaMusica } from './SelosDaMusica'

export function EscolhaDeMusica({
  titulo,
  sub,
  aoVoltar,
  aoEscolher,
}: {
  titulo: string
  sub: string
  aoVoltar: () => void
  aoEscolher: (escolha: Escolha) => void
}) {
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>('/api/musicas')
  const acao = usarAcao()
  const [link, escreverLink] = useState('')
  const [termo, escreverTermo] = useState('')

  const resolver = () => {
    acao.executar(async () => {
      const resolucao = await api<Resolucao>('/api/musicas/resolver', { metodo: 'POST', corpo: { link } })
      aoEscolher(escolhaDoLink(resolucao, link.trim()))
    })
  }

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <Barra titulo={titulo} sub={sub} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="secao">
        <h2>Link do YouTube</h2>
        <p className="dica">Título, capa e artista vêm sozinhos. A Música só entra no catálogo quando você confirmar.</p>
        <div className="campo-com-botao">
          <input
            inputMode="url"
            placeholder="https://youtu.be/…"
            value={link}
            onChange={(evento) => escreverLink(evento.target.value)}
          />
          <button type="button" className="botao" disabled={acao.ocupado || !link.trim()} onClick={resolver}>
            Buscar
          </button>
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <h2>Catálogo</h2>
          <span className="dica">faz mais tempo primeiro</span>
        </div>

        <label className="campo">
          <span className="rotulo">Buscar no catálogo</span>
          <input
            type="search"
            placeholder="parte do título ou do artista"
            value={termo}
            onChange={(evento) => escreverTermo(evento.target.value)}
          />
        </label>

        {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
        {catalogo.carregando && <div className="girando" role="status" aria-label="Carregando" />}

        {catalogo.dados && achadas.length === 0 && <p className="vazio">Nenhuma Música com esse texto.</p>}

        {achadas.length > 0 && (
          <ul className="lista cartao">
            {achadas.map((musica) => (
              <li key={musica.id}>
                <button type="button" className="toque" onClick={() => aoEscolher(escolhaDaMusica(musica))}>
                  <Capa musicas={[musica]} />
                  <span className="cresce">
                    <span className="titulo">{musica.titulo}</span>
                    <span className="dica">{musica.artista}</span>
                    <SelosDaMusica musica={musica} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
