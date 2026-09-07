import { useState } from 'react'
import { api } from '../api/cliente'
import type { MusicaNaLista, Resolucao, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { combinaBusca } from '../dominio'
import type { OrdemDoCatalogo } from '../dominio'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaMusica, escolhaDaSugestao, escolhaDoLink } from '../escalas/rascunho'
import type { FiltroDoCatalogo } from '../musicas/catalogo'
import { FILTROS, ORDENS, caminhoDoCatalogo, textoDoVazio } from '../musicas/catalogo'
import { Barra } from './Barra'
import { Capa } from './Capa'
import { SelosDaMusica } from './SelosDaMusica'

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
  const [termo, escreverTermo] = useState('')
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>(caminhoDoCatalogo(filtro, ordem))
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>(aoEscolherSugestao ? '/api/sugestoes' : null)
  const acao = usarAcao()

  const resolver = () => {
    acao.executar(async () => {
      const resolucao = await api<Resolucao>('/api/musicas/resolver', { metodo: 'POST', corpo: { link } })
      aoEscolher(escolhaDoLink(resolucao, link.trim()))
    })
  }

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))
  const abertas = sugestoes.dados?.sugestoes ?? []

  return (
    <section className="pagina">
      <Barra titulo={titulo} sub={sub} aoVoltar={aoVoltar} />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {aoEscolherSugestao && (
        <div className="abas" role="group" aria-label="De onde escolher">
          <button type="button" className="chip" aria-pressed={aba === 'catalogo'} onClick={() => trocarAba('catalogo')}>
            Catálogo
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={aba === 'sugestoes'}
            onClick={() => trocarAba('sugestoes')}
          >
            Sugestões {abertas.length > 0 && <span className="conta">{abertas.length}</span>}
          </button>
        </div>
      )}

      {aba === 'sugestoes' && aoEscolherSugestao ? (
        <div className="secao">
          {sugestoes.erro && <p className="aviso">{sugestoes.erro}</p>}
          {sugestoes.carregando && <div className="girando" role="status" aria-label="Carregando" />}
          {sugestoes.dados && abertas.length === 0 && <p className="vazio">Nenhuma Sugestão aberta.</p>}

          {abertas.length > 0 && (
            <ul className="lista cartao">
              {abertas.map((sugestao) => (
                <li key={sugestao.id}>
                  <button type="button" className="toque" onClick={() => aoEscolherSugestao(sugestao)}>
                    <Capa musicas={[escolhaDaSugestao(sugestao).resumo]} />
                    <span className="cresce">
                      <span className="titulo">{sugestao.titulo}</span>
                      <span className="dica">
                        {sugestao.membro.nome} · {sugestao.apoios.length} apoio
                        {sugestao.apoios.length === 1 ? '' : 's'}
                      </span>
                      {sugestao.observacao && <span className="observacao">{sugestao.observacao}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="secao">
            <h2>Link do YouTube</h2>
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
            <h2>Catálogo</h2>

            <label className="campo">
              <span className="rotulo">Buscar no catálogo</span>
              <input
                type="search"
                placeholder="parte do título ou do artista"
                value={termo}
                onChange={(evento) => escreverTermo(evento.target.value)}
              />
            </label>

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
            {catalogo.carregando && <div className="girando" role="status" aria-label="Carregando" />}

            {catalogo.dados && achadas.length === 0 && <p className="vazio">{textoDoVazio(filtro, termo)}</p>}

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
        </>
      )}
    </section>
  )
}
