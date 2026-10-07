import { useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/cliente'
import type { AchadoNoYoutube, MusicaNaLista, Resolucao, SugestaoApresentada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { combinaBusca, hojeEmBrasilia, videoIdDoLink } from '../dominio'
import type { Escolha } from '../escalas/rascunho'
import { escolhaDaMusica, escolhaDaSugestao, escolhaDoLink } from '../escalas/rascunho'
import { marcarTarefa } from '../guia/andamento'
import { ABAS_DO_CATALOGO, agruparCatalogo, aplicarVer, contagemPorAba, VISOES } from '../musicas/catalogo'
import type { AbaDoCatalogo, SecaoDoCatalogo, Ver } from '../musicas/catalogo'
import { usarEu } from '../sessao/sessao'
import { Botao } from './Botao'
import { Busca } from './Busca'
import { Esqueleto } from './Esqueleto'
import { LinhaDeMusica } from './LinhaDeMusica'
import { Menu } from './Menu'
import { Segmento } from './Segmento'
import { Selo } from './Selo'
import { Vazio } from './Vazio'
import { VistoEm } from './VistoEm'

export type ModoDoCatalogo = 'navegacao' | 'escolha'

export type PropriedadesDoCatalogo = {
  modo: ModoDoCatalogo
  escalaId?: string
  permiteYoutube: boolean
  aoEscolher?: (escolha: Escolha) => void
  aoEscolherSugestao?: (sugestao: SugestaoApresentada) => void
  titulo?: string
  sub?: string
  aoVoltar?: () => void
  acima?: ReactNode
}

const PRIMEIRAS_DA_SECAO_NUNCA = 3

export function Catalogo({
  modo,
  escalaId,
  permiteYoutube,
  aoEscolher,
  aoEscolherSugestao,
  titulo,
  sub,
  aoVoltar,
  acima,
}: PropriedadesDoCatalogo) {
  const eu = usarEu()
  const catalogo = usarBusca<{ musicas: MusicaNaLista[]; semanasDeRepeticao: number }>(
    '/api/musicas' + (escalaId ? `?escalaId=${encodeURIComponent(escalaId)}` : ''),
  )
  const sugestoes = usarBusca<{ sugestoes: SugestaoApresentada[] }>(aoEscolherSugestao ? '/api/sugestoes' : null)

  return (
    <div className="catalogo">
      {titulo && aoVoltar && <Cabecalho titulo={titulo} sub={sub} aoVoltar={aoVoltar} />}
      <VistoEm hora={catalogo.vistoEm} />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <Esqueleto forma="linha-de-musica" quantidade={6} />}

      {catalogo.dados && (
        <CorpoDoCatalogo
          modo={modo}
          euId={eu.id}
          musicas={catalogo.dados.musicas}
          semanas={catalogo.dados.semanasDeRepeticao}
          sugestoes={sugestoes.dados?.sugestoes.filter((sugestao) => sugestao.estado === 'aberta')}
          permiteYoutube={permiteYoutube}
          aoEscolher={aoEscolher}
          aoEscolherSugestao={aoEscolherSugestao}
          acima={acima}
          resolverLink={async (link) => escolhaDoLink(await api<Resolucao>('/api/musicas/resolver', { metodo: 'POST', corpo: { link } }), link)}
          buscarNoYoutube={async (termo) =>
            (await api<{ achados: AchadoNoYoutube[] }>(`/api/musicas/buscar?termo=${encodeURIComponent(termo)}`)).achados
          }
        />
      )}
    </div>
  )
}

export function CorpoDoCatalogo({
  modo,
  euId,
  musicas,
  semanas,
  sugestoes,
  permiteYoutube,
  aoEscolher,
  aoEscolherSugestao,
  acima,
  resolverLink,
  buscarNoYoutube,
  hoje = hojeEmBrasilia(),
}: {
  modo: ModoDoCatalogo
  euId: string
  musicas: MusicaNaLista[]
  semanas: number
  sugestoes?: SugestaoApresentada[]
  permiteYoutube: boolean
  aoEscolher?: (escolha: Escolha) => void
  aoEscolherSugestao?: (sugestao: SugestaoApresentada) => void
  acima?: ReactNode
  resolverLink?: (link: string) => Promise<Escolha>
  buscarNoYoutube?: (termo: string) => Promise<AchadoNoYoutube[]>
  hoje?: string
}) {
  const [termo, escreverTermo] = useState('')
  const [aba, trocarAba] = useState<AbaDoCatalogo>('redescobrir')
  const [ver, mudarVer] = useState<Ver>('todas')
  const [achados, guardarAchados] = useState<AchadoNoYoutube[] | null>(null)
  const [nuncaAberta, abrirNunca] = useState(false)
  const acao = usarAcao()

  const modoDaLinha = modo === 'navegacao' ? 'navegacao' : 'escolha'
  const podeColarLink = permiteYoutube && !!aoEscolher && !!resolverLink

  const escolherLink = (link: string) =>
    acao.executar(async () => {
      aoEscolher?.(await resolverLink!(link))
    })

  const escrever = (valor: string) => {
    escreverTermo(valor)
    guardarAchados(null)
    if (podeColarLink && videoIdDoLink(valor.trim())) escolherLink(valor.trim())
  }

  const procurarNoYoutube = () =>
    acao.executar(async () => {
      guardarAchados(await buscarNoYoutube!(termo.trim()))
    })

  const linha = (musica: MusicaNaLista) => (
    <LinhaDeMusica
      key={musica.id}
      musica={musica}
      modo={modoDaLinha}
      tempo="direita"
      hoje={hoje}
      aoEscolher={aoEscolher ? () => aoEscolher(escolhaDaMusica(musica)) : undefined}
    />
  )

  const buscando = termo.trim() !== ''
  const contagem = contagemPorAba(musicas)
  const abertas = sugestoes ?? []

  const visoes = [
    ...VISOES,
    ...(aoEscolherSugestao ? [{ valor: 'sugestoes' as const, rotulo: `Sugestões abertas · ${abertas.length}` }] : []),
  ]
  const visaoAtual = visoes.find((visao) => visao.valor === ver) ?? visoes[0]

  if (buscando) {
    const resultados = musicas.filter((musica) => combinaBusca(musica, termo))

    return (
      <>
        <Busca valor={termo} aoMudar={escrever} placeholder="Buscar ou colar um link" rotulo="Buscar ou colar um link" />
        {acao.erro && <p className="aviso">{acao.erro}</p>}

        {resultados.length > 0 ? (
          <div className="secao-do-catalogo">
            <h2 className="titulo-da-secao">
              {resultados.length === 1 ? '1 resultado' : `${resultados.length} resultados`}
            </h2>
            <ul className="lista cartao">{resultados.map(linha)}</ul>
          </div>
        ) : achados ? (
          achados.length === 0 ? (
            <Vazio icone="youtube">Nenhum vídeo com esse nome no YouTube.</Vazio>
          ) : (
            <div className="secao-do-catalogo">
              <h2 className="titulo-da-secao">No YouTube</h2>
              <ul className="lista cartao">
                {achados.map((achado) => (
                  <LinhaDeMusica
                    key={achado.videoId}
                    musica={{ ...achado, id: achado.videoId, titulo: achado.titulo, artista: achado.canal }}
                    modo="escolha"
                    aoEscolher={() => escolherLink(`https://youtu.be/${achado.videoId}`)}
                  />
                ))}
              </ul>
            </div>
          )
        ) : (
          <Vazio
            icone="musica"
            acao={
              permiteYoutube && buscarNoYoutube ? (
                <Botao variante="secundario" icone="youtube" carregando={acao.ocupado} onClick={procurarNoYoutube}>
                  Buscar “{termo.trim()}” no YouTube
                </Botao>
              ) : undefined
            }
          >
            {permiteYoutube ? 'Nenhuma música com esse nome. Cole um link ou busque no YouTube.' : 'Nenhuma música com esse nome.'}
          </Vazio>
        )}
      </>
    )
  }

  const explicacao = ABAS_DO_CATALOGO.find((opcao) => opcao.valor === aba)?.explicacao

  return (
    <>
      <Busca
        valor={termo}
        aoMudar={escrever}
        placeholder="Buscar ou colar um link do YouTube"
        rotulo="Buscar ou colar um link"
        guia="busca"
      />
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {acima}

      <div className="topo-do-catalogo" data-guia="abas-do-catalogo">
        <Segmento
          rotulo="Aba do catálogo"
          opcoes={ABAS_DO_CATALOGO.map((opcao) => ({
            valor: opcao.valor,
            rotulo: (
              <>
                <span>{opcao.rotulo}</span>
                <span className="conta">{contagem[opcao.valor]}</span>
              </>
            ),
          }))}
          valor={aba}
          aoMudar={(nova) => {
            trocarAba(nova)
            if (modo === 'navegacao') marcarTarefa('catalogo')
          }}
        />
        <Menu
          rotulo="Ver"
          gatilho={
            <button type="button" className="chip chip-do-ver" aria-pressed={ver !== 'todas'} data-guia="ver">
              <Icone nome="lista" />
              {ver === 'todas' ? 'Ver' : visaoAtual.rotulo}
            </button>
          }
          itens={visoes.map((visao) => ({
            rotulo: visao.rotulo,
            marcado: visao.valor === ver,
            aoEscolher: () => {
              mudarVer(visao.valor)
              if (modo === 'navegacao') marcarTarefa('catalogo')
            },
          }))}
        />
      </div>

      {ver !== 'sugestoes' && explicacao && <p className="dica explicacao-da-aba">{explicacao}</p>}

      {ver === 'sugestoes' && aoEscolherSugestao ? (
        <ListaDeSugestoes sugestoes={abertas} hoje={hoje} aoEscolherSugestao={aoEscolherSugestao} />
      ) : (
        <Secoes
          secoes={agruparCatalogo(aplicarVer(musicas, ver, euId), aba, semanas)}
          aba={aba}
          nuncaAberta={nuncaAberta}
          abrirNunca={() => abrirNunca(true)}
          linha={linha}
          vazio={
            ver === 'todas'
              ? 'Nenhuma música aqui ainda.'
              : `Nenhuma música em «${visaoAtual.rotulo}» nesta aba.`
          }
        />
      )}
    </>
  )
}

function Secoes({
  secoes,
  aba,
  nuncaAberta,
  abrirNunca,
  linha,
  vazio,
}: {
  secoes: SecaoDoCatalogo[]
  aba: AbaDoCatalogo
  nuncaAberta: boolean
  abrirNunca: () => void
  linha: (musica: MusicaNaLista) => ReactNode
  vazio: string
}) {
  if (secoes.length === 0) return <Vazio icone="musica">{vazio}</Vazio>

  return (
    <div className={`secoes-do-catalogo${aba === 'todas' ? ' com-indice' : ''}`} data-guia="catalogo-lista">
      {secoes.map((secao) => {
        const recolhida = secao.chave === 'nunca' && !nuncaAberta && secao.musicas.length > PRIMEIRAS_DA_SECAO_NUNCA
        const mostradas = recolhida ? secao.musicas.slice(0, PRIMEIRAS_DA_SECAO_NUNCA) : secao.musicas

        return (
          <div key={secao.chave} id={secao.chave} className="secao-do-catalogo">
            <h2 className={`titulo-da-secao${secao.atencao ? ' atencao' : ''}`}>
              {secao.titulo} <span className="rotulo">{secao.musicas.length}</span>
            </h2>
            <ul className="lista cartao">
              {mostradas.map(linha)}
              {recolhida && (
                <li>
                  <button type="button" className="ver-todas" onClick={abrirNunca}>
                    Ver todas as {secao.musicas.length}
                    <Icone nome="seta" />
                  </button>
                </li>
              )}
            </ul>
          </div>
        )
      })}

      {aba === 'todas' && (
        <nav className="indice-de-letras" aria-label="Índice de letras">
          {secoes.map((secao) => (
            <button
              key={secao.chave}
              type="button"
              onClick={() => document.getElementById(secao.chave)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
            >
              {secao.titulo}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function ListaDeSugestoes({
  sugestoes,
  hoje,
  aoEscolherSugestao,
}: {
  sugestoes: SugestaoApresentada[]
  hoje: string
  aoEscolherSugestao: (sugestao: SugestaoApresentada) => void
}) {
  if (sugestoes.length === 0) {
    return <Vazio icone="lampada">Nenhuma sugestão aberta.</Vazio>
  }

  return (
    <div className="secao-do-catalogo">
      <h2 className="titulo-da-secao">
        Sugestões abertas <span className="rotulo">{sugestoes.length}</span>
      </h2>
      <ul className="lista cartao">
        {sugestoes.map((sugestao) => (
          <LinhaDeMusica
            key={sugestao.id}
            musica={sugestao.musica ?? escolhaDaSugestao(sugestao).resumo}
            modo="escolha"
            tempo="direita"
            hoje={hoje}
            aoEscolher={() => aoEscolherSugestao(sugestao)}
            observacao={sugestao.observacao || undefined}
            selos={
              <Selo>
                {sugestao.membro.nome} sugeriu · {sugestao.apoios.length} apoio{sugestao.apoios.length === 1 ? '' : 's'}
              </Selo>
            }
          />
        ))}
      </ul>
    </div>
  )
}
