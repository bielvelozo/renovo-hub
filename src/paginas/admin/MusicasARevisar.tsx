import { useState } from 'react'
import { api } from '../../api/cliente'
import type { MusicaNaLista } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Capa } from '../../componentes/Capa'
import { Folha } from '../../componentes/Folha'
import { buscaNoCifraClub, linkDoVideo } from '../../dominio'

export function MusicasARevisar() {
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>('/api/musicas?filtro=revisar')
  const acao = usarAcao()
  const [escolhida, escolher] = useState<MusicaNaLista | null>(null)

  const musicas = catalogo.dados?.musicas ?? []

  const gravar = (tarefa: () => Promise<void>) => {
    escolher(null)

    acao.executar(async () => {
      await tarefa()
      catalogo.recarregar()
    })
  }

  return (
    <section className="pagina">
      <Barra
        titulo="Músicas a revisar"
        sub={`${musicas.length} esperando revisão`}
        voltarPara="/admin"
      />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {catalogo.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      <p className="dica">
        Vieram da playlist do YouTube com o título e o canal do vídeo. Arrume o nome da Música e o artista de verdade;
        marcar como revisada tira daqui.
      </p>

      {catalogo.dados && musicas.length === 0 && (
        <p className="vazio">Nenhuma Música esperando revisão. O catálogo está em dia.</p>
      )}

      {musicas.length > 0 && (
        <ul className="lista cartao">
          {musicas.map((musica) => (
            <li key={musica.id}>
              <button type="button" className="toque" onClick={() => escolher(musica)}>
                <Capa musicas={[musica]} />
                <span className="cresce">
                  <span className="titulo">{musica.titulo}</span>
                  <span className="dica">{musica.artista || 'sem artista'}</span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {escolhida && <FolhaDaRevisao musica={escolhida} fechar={() => escolher(null)} gravar={gravar} />}
    </section>
  )
}

function FolhaDaRevisao({
  musica,
  fechar,
  gravar,
}: {
  musica: MusicaNaLista
  fechar: () => void
  gravar: (tarefa: () => Promise<void>) => void
}) {
  const [titulo, escreverTitulo] = useState(musica.titulo)
  const [artista, escreverArtista] = useState(musica.artista)

  const salvar = (revisar: boolean) =>
    gravar(async () => {
      await api(`/api/musicas/${musica.id}`, {
        metodo: 'PATCH',
        corpo: { titulo: titulo.trim(), artista: artista.trim(), revisar },
      })
    })

  return (
    <Folha titulo="Revisar Música" fechar={fechar}>
      <Capa musicas={[musica]} grande />

      <label className="campo">
        <span className="rotulo">Título</span>
        <input value={titulo} onChange={(evento) => escreverTitulo(evento.target.value)} />
      </label>

      <label className="campo">
        <span className="rotulo">Artista</span>
        <input value={artista} onChange={(evento) => escreverArtista(evento.target.value)} />
      </label>

      <a className="dica" href={linkDoVideo(musica)} target="_blank" rel="noopener">
        Abrir o vídeo no YouTube
      </a>
      <a className="dica" href={buscaNoCifraClub({ titulo })} target="_blank" rel="noopener">
        Conferir no Cifra Club
      </a>

      <button type="button" className="botao largo" disabled={!titulo.trim()} onClick={() => salvar(false)}>
        Salvar e marcar revisada
      </button>
      <button type="button" className="botao secundario largo" disabled={!titulo.trim()} onClick={() => salvar(true)}>
        Salvar e deixar na lista
      </button>
    </Folha>
  )
}
