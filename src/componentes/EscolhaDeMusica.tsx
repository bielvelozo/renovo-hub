import { useState } from 'react'
import { api } from '../api/cliente'
import type { AchadoNoYoutube, MusicaNaLista, Resolucao, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { combinaBusca, videoIdDoLink } from '../dominio'
import type { OrdemDoCatalogo } from '../dominio'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaMusica, escolhaDaSugestao, escolhaDoLink } from '../escalas/rascunho'
import type { FiltroDoCatalogo } from '../musicas/catalogo'
import { FILTROS, ORDENS, caminhoDoCatalogo, textoDoVazio } from '../musicas/catalogo'
import { Botao } from './Botao'
import { Busca } from './Busca'
import { Esqueleto } from './Esqueleto'
import { LinhaDeMusica } from './LinhaDeMusica'
import { Selo } from './Selo'
import { Segmento } from './Segmento'
import { Vazio } from './Vazio'

export function EscolhaDeMusica({
  titulo,
  sub,
  aoVoltar,
  aoEscolher,
  aoEscolherSugestao,
}: {
  titulo: string
  sub: string
  aoVoltar: () => void
  aoEscolher: (escolha: Escolha) => void
  aoEscolherSugestao?: (sugestao: SugestaoApresentada) => void
}) {
  const [aba, trocarAba] = useState<'catalogo' | 'sugestoes'>('catalogo')
  const [filtro, filtrar] = useState<FiltroDoCatalogo>('todas')
  const [ordem, ordenar] = useState<OrdemDoCatalogo>('mais-tempo')
  const [link, escreverLink] = useState('')
  const [achados, guardarAchados] = useState<AchadoNoYoutube[] | null>(null)
  const [termo, escreverTermo] = useState('')
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>(caminhoDoCatalogo(filtro, ordem))
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>(aoEscolherSugestao ? '/api/sugestoes' : null)
  const acao = usarAcao()

  const escolherVideo = (endereco: string) =>
    acao.executar(async () => {
      const resolucao = await api<Resolucao>('/api/musicas/resolver', { metodo: 'POST', corpo: { link: endereco } })
      aoEscolher(escolhaDoLink(resolucao, endereco))
    })

  const procurar = () => {
    const escrito = link.trim()

    if (videoIdDoLink(escrito)) {
      guardarAchados(null)
      return escolherVideo(escrito)
    }

    acao.executar(async () => {
      const { achados: vindos } = await api<{ achados: AchadoNoYoutube[] }>(
        `/api/musicas/buscar?termo=${encodeURIComponent(escrito)}`,
      )
      guardarAchados(vindos)
    })
  }

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))
  const abertas = sugestoes.dados?.sugestoes ?? []

  return (
    <section className="pagina">
      <Cabecalho titulo={titulo} sub={sub} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {aoEscolherSugestao && (
        <Segmento
          rotulo="De onde escolher"
          opcoes={[
            { valor: 'catalogo', rotulo: 'Catálogo' },
            {
              valor: 'sugestoes',
              rotulo: (
                <>
                  Sugestões {abertas.length > 0 && <span className="conta">{abertas.length}</span>}
                </>
              ),
            },
          ]}
          valor={aba}
          aoMudar={trocarAba}
        />
      )}

      {aba === 'sugestoes' && aoEscolherSugestao ? (
        <div className="secao">
          {sugestoes.erro && <p className="aviso">{sugestoes.erro}</p>}
          {sugestoes.carregando && <Esqueleto forma="linha-de-musica" quantidade={3} />}
          {sugestoes.dados && abertas.length === 0 && <Vazio icone="lampada">Nenhuma Sugestão aberta.</Vazio>}

          {abertas.length > 0 && (
            <ul className="lista cartao">
              {abertas.map((sugestao) => (
                <LinhaDeMusica
                  key={sugestao.id}
                  musica={escolhaDaSugestao(sugestao).resumo}
                  modo="escolha"
                  aoEscolher={() => aoEscolherSugestao(sugestao)}
                  observacao={sugestao.observacao || undefined}
                  selos={
                    <Selo>
                      {sugestao.membro.nome} · {sugestao.apoios.length} apoio{sugestao.apoios.length === 1 ? '' : 's'}
                    </Selo>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="secao">
            <h2>Buscar no YouTube</h2>
            <div className="campo-com-botao">
              <input
                placeholder="nome da música ou link"
                value={link}
                onChange={(evento) => {
                  escreverLink(evento.target.value)
                  guardarAchados(null)
                }}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' && link.trim()) procurar()
                }}
              />
              <Botao disabled={acao.ocupado || !link.trim()} onClick={procurar}>
                Buscar
              </Botao>
            </div>

            {achados?.length === 0 && <Vazio icone="youtube">Nenhum vídeo com esse nome.</Vazio>}

            {achados && achados.length > 0 && (
              <ul className="lista cartao">
                {achados.map((achado) => (
                  <LinhaDeMusica
                    key={achado.videoId}
                    musica={{ ...achado, id: achado.videoId, titulo: achado.titulo, artista: achado.canal }}
                    modo="escolha"
                    aoEscolher={() => escolherVideo(`https://youtu.be/${achado.videoId}`)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="secao">
            <h2>Catálogo</h2>

            <Busca valor={termo} aoMudar={escreverTermo} rotulo="Buscar no catálogo" />

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

            {catalogo.dados && achadas.length === 0 && <Vazio icone="musica">{textoDoVazio(filtro, termo)}</Vazio>}

            {achadas.length > 0 && (
              <ul className="lista cartao">
                {achadas.map((musica) => (
                  <LinhaDeMusica
                    key={musica.id}
                    musica={musica}
                    modo="escolha"
                    aoEscolher={() => aoEscolher(escolhaDaMusica(musica))}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
