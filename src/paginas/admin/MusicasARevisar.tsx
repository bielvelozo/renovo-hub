import { useState } from 'react'
import { api } from '../../api/cliente'
import type { MusicaNaLista } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { Capa } from '../../componentes/Capa'
import { Esqueleto } from '../../componentes/Esqueleto'
import { Folha } from '../../componentes/Folha'
import { LinhaDeMusica } from '../../componentes/LinhaDeMusica'
import { Vazio } from '../../componentes/Vazio'
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
      <Cabecalho titulo="Músicas a revisar" sub={`${musicas.length} esperando revisão`} voltarPara="/admin" />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {catalogo.carregando && <Esqueleto forma="linha-de-musica" quantidade={4} />}

      <p className="dica">
        Vieram da playlist do YouTube com o título e o canal do vídeo. Arrume o nome da Música e o artista de verdade;
        marcar como revisada tira daqui.
      </p>

      {catalogo.dados && musicas.length === 0 && (
        <Vazio icone="musica">Nenhuma Música esperando revisão. O catálogo está em dia.</Vazio>
      )}

      {musicas.length > 0 && (
        <ul className="lista cartao">
          {musicas.map((musica) => (
            <LinhaDeMusica key={musica.id} musica={musica} modo="escolha" aoEscolher={() => escolher(musica)} />
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

      <Campo rotulo="Título">
        <input value={titulo} onChange={(evento) => escreverTitulo(evento.target.value)} />
      </Campo>

      <Campo rotulo="Artista">
        <input value={artista} onChange={(evento) => escreverArtista(evento.target.value)} />
      </Campo>

      <a className="dica" href={linkDoVideo(musica)} target="_blank" rel="noopener">
        Abrir o vídeo no YouTube
      </a>
      <a className="dica" href={buscaNoCifraClub({ titulo })} target="_blank" rel="noopener">
        Conferir no Cifra Club
      </a>

      <Botao largo disabled={!titulo.trim()} onClick={() => salvar(false)}>
        Salvar e marcar revisada
      </Botao>
      <Botao variante="secundario" largo disabled={!titulo.trim()} onClick={() => salvar(true)}>
        Salvar e deixar na lista
      </Botao>
    </Folha>
  )
}
