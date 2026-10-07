import { useState } from 'react'
import type { Anexo, MusicaNaLista } from '../../api/tipos'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Busca } from '../../componentes/Busca'
import { Esqueleto } from '../../componentes/Esqueleto'
import { FolhaDaLetra } from '../../componentes/FolhaDaLetra'
import { LinhaDeMusica } from '../../componentes/LinhaDeMusica'
import { Vazio } from '../../componentes/Vazio'
import { combinaBusca } from '../../dominio'

const MAXIMO_NA_LISTA = 30

export function Sequencias() {
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>('/api/musicas')
  const [termo, escrever] = useState('')
  const [escolhida, escolher] = useState<MusicaNaLista | null>(null)

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <Cabecalho titulo="Sequências" sub="A letra da música em Word, com versões" voltarPara="/admin" />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <Esqueleto forma="linha-de-musica" quantidade={5} />}

      <Busca valor={termo} aoMudar={escrever} rotulo="Buscar a música" />

      {catalogo.dados && achadas.length === 0 && <Vazio icone="musica">Nenhuma música com esse texto.</Vazio>}

      {achadas.length > 0 && (
        <ul className="lista cartao">
          {achadas.slice(0, MAXIMO_NA_LISTA).map((musica) => (
            <LinhaDeMusica key={musica.id} musica={musica} modo="escolha" aoEscolher={() => escolher(musica)} />
          ))}
        </ul>
      )}

      {achadas.length > MAXIMO_NA_LISTA && (
        <p className="dica">Mostrando as 30 primeiras. Busque pelo título pra achar a sua.</p>
      )}

      {escolhida && <FolhaDaSequencia musica={escolhida} fechar={() => escolher(null)} />}
    </section>
  )
}

function FolhaDaSequencia({ musica, fechar }: { musica: MusicaNaLista; fechar: () => void }) {
  const anexos = usarBusca<{ anexos: Anexo[] }>(`/api/musicas/${musica.id}/anexos`)

  return (
    <FolhaDaLetra
      titulo={musica.titulo}
      dono={{ musicaId: musica.id }}
      anexos={anexos.dados?.anexos ?? []}
      fechar={fechar}
      aoEnviar={() => anexos.recarregar()}
    />
  )
}
